import { prisma } from '../config/prisma';
import { stripe } from '../config/stripe';
import { sendOrderReceiptEmail } from '../config/resend';
import { checkAndNotifyLowStock } from './seedling.service';
import { AppError } from '../middleware/errorHandler';
import { AvailabilityStatus } from '@prisma/client';

interface CheckoutItem {
  seedlingId: string;
  quantity: number;
}

export async function createPaymentIntent(params: {
  customerId: string;
  nurseryId: string;
  items: CheckoutItem[];
  fulfillmentType: 'DELIVERY' | 'PICKUP';
  deliveryAddress?: string;
  deliveryLat?: number;
  deliveryLng?: number;
}) {
  const { customerId, nurseryId, items, fulfillmentType, deliveryAddress } = params;

  // 1. Fetch all seedlings
  const seedlingIds = items.map((i) => i.seedlingId);
  const seedlings = await prisma.seedling.findMany({
    where: { id: { in: seedlingIds } },
  });

  if (seedlings.length !== seedlingIds.length) {
    throw new AppError('One or more seedlings not found', 400);
  }

  // 2. Verify all belong to nurseryId
  const wrongNursery = seedlings.find((s) => s.nurseryId !== nurseryId);
  if (wrongNursery) {
    throw new AppError(`Seedling "${wrongNursery.name}" does not belong to this nursery`, 400);
  }

  // 3. Verify availability and stock
  for (const item of items) {
    const seedling = seedlings.find((s) => s.id === item.seedlingId)!;
    if (seedling.availabilityStatus !== AvailabilityStatus.AVAILABLE) {
      throw new AppError(`"${seedling.name}" is not available`, 400);
    }
    if (seedling.quantity < item.quantity) {
      throw new AppError(
        `Insufficient stock for "${seedling.name}". Available: ${seedling.quantity}`,
        400,
      );
    }
  }

  // 4. Calculate total
  const orderSummary = items.map((item) => {
    const seedling = seedlings.find((s) => s.id === item.seedlingId)!;
    const subtotal = seedling.price * item.quantity;
    return {
      seedlingId: item.seedlingId,
      name: seedling.name,
      size: seedling.size,
      unitPrice: seedling.price,
      quantity: item.quantity,
      subtotal,
    };
  });

  const totalAmount = orderSummary.reduce((sum, i) => sum + i.subtotal, 0);

  // 5. Create Stripe PaymentIntent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(totalAmount),
    currency: 'ugx',
    metadata: {
      nurseryId,
      customerId,
      fulfillmentType,
      items: JSON.stringify(items),
      deliveryAddress: deliveryAddress ?? '',
    },
  });

  return {
    clientSecret: paymentIntent.client_secret!,
    paymentIntentId: paymentIntent.id,
    orderSummary,
  };
}

export async function fulfillOrder(paymentIntentId: string) {
  // 1. Retrieve PaymentIntent from Stripe
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  const meta = paymentIntent.metadata;

  // 2. Parse items from metadata
  const items: CheckoutItem[] = JSON.parse(meta.items ?? '[]');

  // 3. Idempotency guard
  const existing = await prisma.order.findUnique({
    where: { stripePaymentIntentId: paymentIntentId },
  });
  if (existing) return existing;

  // Fetch seedlings for order item snapshots
  const seedlingIds = items.map((i) => i.seedlingId);
  const seedlings = await prisma.seedling.findMany({
    where: { id: { in: seedlingIds } },
  });

  const totalAmount = items.reduce((sum, item) => {
    const s = seedlings.find((x) => x.id === item.seedlingId);
    return sum + (s?.price ?? 0) * item.quantity;
  }, 0);

  // 4. Prisma transaction: Order + OrderItems + quantity decrements
  const order = await prisma.$transaction(async (tx) => {
    const createdOrder = await tx.order.create({
      data: {
        nurseryId: meta.nurseryId,
        customerId: meta.customerId,
        fulfillmentType: meta.fulfillmentType as 'DELIVERY' | 'PICKUP',
        fulfillmentStatus: 'PENDING',
        deliveryAddress: meta.deliveryAddress || null,
        saleMethod: 'ONLINE',
        stripePaymentIntentId: paymentIntentId,
        totalAmount,
        receiptEmailSent: false,
      },
    });

    // Create order items
    await tx.orderItem.createMany({
      data: items.map((item) => {
        const s = seedlings.find((x) => x.id === item.seedlingId)!;
        return {
          orderId: createdOrder.id,
          seedlingId: item.seedlingId,
          seedlingName: s.name,
          seedlingSize: s.size,
          unitPrice: s.price,
          quantity: item.quantity,
        };
      }),
    });

    // Decrement each seedling's quantity
    await Promise.all(
      items.map((item) =>
        tx.seedling.update({
          where: { id: item.seedlingId },
          data: { quantity: { decrement: item.quantity } },
        }),
      ),
    );

    return createdOrder;
  });

  // 5. Create CareReminder
  try {
    const nursery = await prisma.nursery.findUnique({
      where: { id: meta.nurseryId },
      select: { careReminderDays: true },
    });
    if (nursery) {
      const scheduledAt = new Date();
      scheduledAt.setDate(scheduledAt.getDate() + nursery.careReminderDays);
      await prisma.careReminder.create({
        data: {
          orderId: order.id,
          customerId: meta.customerId,
          scheduledAt,
        },
      });
    }
  } catch (err) {
    console.error('CareReminder creation failed:', err);
  }

  // 6. Send receipt email
  try {
    const customer = await prisma.user.findUnique({
      where: { id: meta.customerId },
      select: { email: true, name: true },
    });
    const nursery = await prisma.nursery.findUnique({
      where: { id: meta.nurseryId },
      select: { name: true },
    });
    if (customer && nursery) {
      await sendOrderReceiptEmail({
        to: customer.email,
        customerName: customer.name,
        orderId: order.id,
        nurseryName: nursery.name,
        items: items.map((item) => {
          const s = seedlings.find((x) => x.id === item.seedlingId)!;
          return { name: s.name, size: s.size, quantity: item.quantity, unitPrice: s.price };
        }),
        totalAmount,
        fulfillmentType: meta.fulfillmentType,
        deliveryAddress: meta.deliveryAddress || undefined,
      });
    }
  } catch (err) {
    console.error('Receipt email failed:', err);
  }

  // 7. Low-stock notifications
  try {
    await Promise.all(
      items.map((item) => checkAndNotifyLowStock(item.seedlingId, meta.nurseryId)),
    );
  } catch (err) {
    console.error('Low-stock check failed:', err);
  }

  return order;
}

import {
  FulfillmentStatus,
  NotificationType,
  SaleMethod,
} from '@prisma/client';
import { UserRole } from '@seednest/shared';
import type { PaginatedResponse } from '@seednest/shared';
import { prisma } from '../config/prisma';
import { AppError, ForbiddenError, NotFoundError } from '../middleware/errorHandler';
import { checkAndNotifyLowStock } from './seedling.service';
import { createNotification } from './notification.service';

interface WalkinItem {
  seedlingId: string;
  quantity: number;
}

// ── createWalkinOrder ─────────────────────────────────────────────────────────
export async function createWalkinOrder(
  managerId: string,
  data: {
    nurseryId: string;
    items: WalkinItem[];
    guestName?: string;
    customerId?: string;
    notes?: string;
  },
) {
  // 1. Verify nursery ownership
  const nursery = await prisma.nursery.findUnique({ where: { id: data.nurseryId } });
  if (!nursery) throw new NotFoundError('Nursery not found');
  if (nursery.managerId !== managerId) throw new ForbiddenError();

  // 2. Fetch seedlings and validate
  const seedlingIds = data.items.map((i) => i.seedlingId);
  const seedlings = await prisma.seedling.findMany({ where: { id: { in: seedlingIds } } });

  if (seedlings.length !== seedlingIds.length) {
    throw new AppError('One or more seedlings not found', 400);
  }

  for (const item of data.items) {
    const s = seedlings.find((x) => x.id === item.seedlingId)!;
    if (s.nurseryId !== data.nurseryId) {
      throw new AppError(`Seedling "${s.name}" does not belong to this nursery`, 400);
    }
    if (s.quantity < item.quantity) {
      throw new AppError(`Insufficient stock for "${s.name}". Available: ${s.quantity}`, 400);
    }
  }

  // 3. Calculate total
  const totalAmount = data.items.reduce((sum, item) => {
    const s = seedlings.find((x) => x.id === item.seedlingId)!;
    return sum + s.price * item.quantity;
  }, 0);

  // 4. Transaction: Order + items + quantity decrements
  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        nurseryId: data.nurseryId,
        customerId: data.customerId ?? null,
        guestName: data.guestName ?? null,
        notes: data.notes ?? null,
        saleMethod: SaleMethod.WALKIN,
        fulfillmentType: 'PICKUP',
        fulfillmentStatus: FulfillmentStatus.COLLECTED,
        totalAmount,
        receiptEmailSent: false,
      },
    });

    await tx.orderItem.createMany({
      data: data.items.map((item) => {
        const s = seedlings.find((x) => x.id === item.seedlingId)!;
        return {
          orderId: created.id,
          seedlingId: item.seedlingId,
          seedlingName: s.name,
          seedlingSize: s.size,
          unitPrice: s.price,
          quantity: item.quantity,
        };
      }),
    });

    await Promise.all(
      data.items.map((item) =>
        tx.seedling.update({
          where: { id: item.seedlingId },
          data: { quantity: { decrement: item.quantity } },
        }),
      ),
    );

    return created;
  });

  // 5. Low-stock notifications (fire-and-forget)
  Promise.all(
    data.items.map((item) =>
      checkAndNotifyLowStock(item.seedlingId, data.nurseryId).catch(console.error),
    ),
  );

  // 6. Return order with items
  return prisma.order.findUnique({
    where: { id: order.id },
    include: { items: true },
  });
}

// ── getOrdersByManager ────────────────────────────────────────────────────────
export async function getOrdersByManager(
  managerId: string,
  filters: {
    nurseryId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    fulfillmentStatus?: FulfillmentStatus;
    saleMethod?: SaleMethod;
    page?: number;
    pageSize?: number;
  },
): Promise<PaginatedResponse<object>> {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;
  const skip = (page - 1) * pageSize;

  const nurseries = await prisma.nursery.findMany({
    where: { managerId },
    select: { id: true },
  });
  const nurseryIds = nurseries.map((n) => n.id);

  if (filters.nurseryId && !nurseryIds.includes(filters.nurseryId)) {
    throw new ForbiddenError();
  }

  const targetIds = filters.nurseryId ? [filters.nurseryId] : nurseryIds;

  const where = {
    nurseryId: { in: targetIds },
    ...(filters.fulfillmentStatus && { fulfillmentStatus: filters.fulfillmentStatus }),
    ...(filters.saleMethod && { saleMethod: filters.saleMethod }),
    ...((filters.dateFrom || filters.dateTo) && {
      createdAt: {
        ...(filters.dateFrom && { gte: filters.dateFrom }),
        ...(filters.dateTo && { lte: filters.dateTo }),
      },
    }),
  };

  const [data, total] = await prisma.$transaction([
    prisma.order.findMany({
      where,
      include: {
        _count: { select: { items: true } },
        customer: { select: { name: true } },
        nursery: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.order.count({ where }),
  ]);

  return { data, total, page, pageSize };
}

// ── getOrderById ──────────────────────────────────────────────────────────────
export async function getOrderById(
  orderId: string,
  requesterId: string,
  requesterRole: UserRole,
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          seedling: { select: { id: true, name: true, photos: true } },
        },
      },
      nursery: { select: { id: true, name: true, address: true, managerId: true } },
      customer: { select: { id: true, name: true, email: true } },
    },
  });

  if (!order) throw new NotFoundError('Order not found');

  if (requesterRole === UserRole.MANAGER) {
    if (order.nursery.managerId !== requesterId) throw new ForbiddenError();
  } else if (requesterRole === UserRole.CUSTOMER) {
    if (order.customerId !== requesterId) throw new ForbiddenError();
  }

  return order;
}

// ── updateFulfillmentStatus ───────────────────────────────────────────────────
export async function updateFulfillmentStatus(
  orderId: string,
  managerId: string,
  status: FulfillmentStatus,
) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new NotFoundError('Order not found');

  // Check nursery ownership separately to avoid Prisma include type inference issues
  const nursery = await prisma.nursery.findUnique({
    where: { id: order.nurseryId },
    select: { managerId: true },
  });
  if (!nursery || nursery.managerId !== managerId) throw new ForbiddenError();

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { fulfillmentStatus: status },
  });

  if (order.customerId) {
    const orderNumber = orderId.substring(0, 8).toUpperCase();
    createNotification({
      userId: order.customerId,
      type: NotificationType.ORDER_UPDATE,
      title: 'Order Status Updated',
      message: `Your order #${orderNumber} status has been updated to ${status}.`,
      relatedId: orderId,
    }).catch(console.error);
  }

  return updated;
}

// ── getOrdersByCustomer ───────────────────────────────────────────────────────
export async function getOrdersByCustomer(
  customerId: string,
  page: number,
  pageSize: number,
): Promise<PaginatedResponse<object>> {
  const skip = (page - 1) * pageSize;
  const where = { customerId };

  const [data, total] = await prisma.$transaction([
    prisma.order.findMany({
      where,
      include: {
        items: {
          include: { seedling: { select: { name: true } } },
        },
        nursery: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.order.count({ where }),
  ]);

  return { data, total, page, pageSize };
}

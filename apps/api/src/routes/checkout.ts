import { Router } from 'express';
import { z } from 'zod';
import { UserRole } from '@seednest/shared';
import { requireAuth, requireRole } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../middleware/errorHandler';
import { stripe } from '../config/stripe';
import { createPaymentIntent, fulfillOrder } from '../services/checkout.service';

// ── Checkout router (used AFTER express.json) ─────────────────────────────────
export const checkoutRouter = Router();

const createPaymentIntentSchema = z.object({
  nurseryId: z.string().uuid(),
  items: z
    .array(
      z.object({
        seedlingId: z.string().uuid(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
  fulfillmentType: z.enum(['DELIVERY', 'PICKUP']),
  deliveryAddress: z.string().optional(),
  deliveryLat: z.number().optional(),
  deliveryLng: z.number().optional(),
});

checkoutRouter.post(
  '/create-payment-intent',
  requireAuth,
  requireRole(UserRole.CUSTOMER),
  asyncHandler(async (req, res) => {
    const parsed = createPaymentIntentSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0]?.message ?? 'Invalid request', 400);
    }

    const { nurseryId, items, fulfillmentType, deliveryAddress, deliveryLat, deliveryLng } =
      parsed.data;

    const result = await createPaymentIntent({
      customerId: req.user!.id,
      nurseryId,
      items,
      fulfillmentType,
      deliveryAddress,
      deliveryLat,
      deliveryLng,
    });

    res.json({
      success: true,
      data: {
        clientSecret: result.clientSecret,
        orderSummary: result.orderSummary,
      },
    });
  }),
);

// ── Stripe webhook router (must be mounted BEFORE express.json) ───────────────
// Uses express.raw() body parser to preserve raw body for signature verification.
export const stripeWebhookRouter = Router();

stripeWebhookRouter.post(
  '/',
  // Raw body parser — MUST come before express.json() in app.ts
  (req, res, next) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('express').raw({ type: 'application/json' })(req, res, next);
  },
  asyncHandler(async (req, res) => {
    const sig = req.headers['stripe-signature'];

    if (!sig) {
      throw new AppError('Missing stripe-signature header', 400);
    }

    let event: ReturnType<typeof stripe.webhooks.constructEvent>;
    try {
      event = stripe.webhooks.constructEvent(
        req.body as Buffer,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!,
      );
    } catch {
      throw new AppError('Webhook signature verification failed', 400);
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntentId = event.data.object.id;
      // Fire and forget — do not await to avoid Stripe timeout
      fulfillOrder(paymentIntentId).catch((err) =>
        console.error('fulfillOrder error:', err),
      );
    }

    res.json({ received: true });
  }),
);

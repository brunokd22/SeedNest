import { Router } from 'express';
import { z } from 'zod';
import { FulfillmentStatus, SaleMethod } from '@prisma/client';
import { UserRole } from '@seednest/shared';
import { requireAuth, requireRole } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../middleware/errorHandler';
import { prisma } from '../config/prisma';
import {
  createWalkinOrder,
  getOrdersByManager,
  getOrderById,
  updateFulfillmentStatus,
  getOrdersByCustomer,
} from '../services/order.service';

const router = Router();

const walkinSchema = z.object({
  nurseryId: z.string().uuid(),
  items: z
    .array(
      z.object({
        seedlingId: z.string().uuid(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
  guestName: z.string().optional(),
  customerId: z.string().uuid().optional(),
  notes: z.string().optional(),
});

// ── Manager routes ────────────────────────────────────────────────────────────

// GET /api/orders — list with filters
router.get(
  '/api/orders',
  requireAuth,
  requireRole(UserRole.MANAGER),
  asyncHandler(async (req, res) => {
    const { nurseryId, dateFrom, dateTo, fulfillmentStatus, saleMethod, page, pageSize } =
      req.query;

    const result = await getOrdersByManager(req.user!.id, {
      nurseryId: nurseryId as string | undefined,
      dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo: dateTo ? new Date(dateTo as string) : undefined,
      fulfillmentStatus: fulfillmentStatus as FulfillmentStatus | undefined,
      saleMethod: saleMethod as SaleMethod | undefined,
      page: page ? parseInt(page as string) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string) : undefined,
    });

    res.json({ success: true, data: result });
  }),
);

// POST /api/orders/walkin — create walk-in sale
// Registered before /:id to avoid param swallowing
router.post(
  '/api/orders/walkin',
  requireAuth,
  requireRole(UserRole.MANAGER),
  asyncHandler(async (req, res) => {
    const parsed = walkinSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0]?.message ?? 'Invalid request', 400);
    }

    const order = await createWalkinOrder(req.user!.id, parsed.data);
    res.status(201).json({ success: true, data: order });
  }),
);

// PATCH /api/orders/:id/status — update fulfillment status
router.patch(
  '/api/orders/:id/status',
  requireAuth,
  requireRole(UserRole.MANAGER),
  asyncHandler(async (req, res) => {
    const { fulfillmentStatus } = req.body as { fulfillmentStatus: FulfillmentStatus };
    if (!fulfillmentStatus) {
      throw new AppError('fulfillmentStatus is required', 400);
    }

    const order = await updateFulfillmentStatus(
      req.params.id as string,
      req.user!.id,
      fulfillmentStatus,
    );
    res.json({ success: true, data: order });
  }),
);

// GET /api/orders/by-payment-intent/:paymentIntentId
// Registered before /:id to avoid param collision
router.get(
  '/api/orders/by-payment-intent/:paymentIntentId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const order = await prisma.order.findUnique({
      where: { stripePaymentIntentId: req.params.paymentIntentId as string },
      include: {
        items: {
          include: { seedling: { select: { id: true, name: true, photos: true } } },
        },
        nursery: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true } },
      },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (req.user!.role === UserRole.CUSTOMER && order.customerId !== req.user!.id) {
      throw new AppError('Forbidden', 403);
    }

    res.json({ success: true, data: order });
  }),
);

// GET /api/orders/:id — single order (manager)
router.get(
  '/api/orders/:id',
  requireAuth,
  requireRole(UserRole.MANAGER),
  asyncHandler(async (req, res) => {
    const order = await getOrderById(req.params.id as string, req.user!.id, UserRole.MANAGER);
    res.json({ success: true, data: order });
  }),
);

// ── Customer routes ───────────────────────────────────────────────────────────

// GET /api/my-orders
router.get(
  '/api/my-orders',
  requireAuth,
  requireRole(UserRole.CUSTOMER),
  asyncHandler(async (req, res) => {
    const page = parseInt((req.query.page as string) ?? '1') || 1;
    const pageSize = parseInt((req.query.pageSize as string) ?? '10') || 10;

    const result = await getOrdersByCustomer(req.user!.id, page, pageSize);
    res.json({ success: true, data: result });
  }),
);

// GET /api/my-orders/:id
router.get(
  '/api/my-orders/:id',
  requireAuth,
  requireRole(UserRole.CUSTOMER),
  asyncHandler(async (req, res) => {
    const order = await getOrderById(req.params.id as string, req.user!.id, UserRole.CUSTOMER);
    res.json({ success: true, data: order });
  }),
);

// ── Utility routes ────────────────────────────────────────────────────────────

// GET /api/users/search — manager looks up customers for walk-in sale
router.get(
  '/api/users/search',
  requireAuth,
  requireRole(UserRole.MANAGER),
  asyncHandler(async (req, res) => {
    const { email, name } = req.query;

    if (!email && !name) {
      throw new AppError('Provide email or name query parameter', 400);
    }

    const users = await prisma.user.findMany({
      where: {
        role: UserRole.CUSTOMER,
        ...(email && { email: { contains: email as string, mode: 'insensitive' } }),
        ...(name && { name: { contains: name as string, mode: 'insensitive' } }),
      },
      select: { id: true, name: true, email: true },
      take: 10,
    });

    res.json({ success: true, data: users });
  }),
);

export default router;

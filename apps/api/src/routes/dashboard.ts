import { Router } from 'express';
import { IssueStatus, UserRole } from '@seednest/shared';
import { requireAuth, requireRole } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { prisma } from '../config/prisma';

const router = Router();

router.get(
  '/stats',
  requireAuth,
  requireRole(UserRole.MANAGER),
  asyncHandler(async (req, res) => {
    const managerId = req.user!.id;

    const nurseries = await prisma.nursery.findMany({
      where: { managerId },
      select: { id: true, name: true, lowStockThreshold: true },
    });
    const nurseryIds = nurseries.map((n) => n.id);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [
      totalSeedlings,
      revenueThisMonth,
      openIssuesCount,
      recentOrders,
      lowStockSeedlings,
    ] = await Promise.all([
      prisma.seedling.count({ where: { nurseryId: { in: nurseryIds } } }),

      prisma.order.aggregate({
        where: {
          nurseryId: { in: nurseryIds },
          createdAt: { gte: monthStart, lt: monthEnd },
        },
        _sum: { totalAmount: true },
      }),

      prisma.issue.count({
        where: {
          nurseryId: { in: nurseryIds },
          status: { in: [IssueStatus.OPEN, IssueStatus.IN_PROGRESS] },
        },
      }),

      prisma.order.findMany({
        where: { nurseryId: { in: nurseryIds } },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          nursery: { select: { name: true } },
          customer: { select: { name: true } },
        },
      }),

      prisma.seedling.findMany({
        where: {
          nurseryId: { in: nurseryIds },
          quantity: { lte: 20 },
        },
        include: { nursery: { select: { name: true, lowStockThreshold: true } } },
        orderBy: { quantity: 'asc' },
      }),
    ]);

    const filteredLowStock = lowStockSeedlings
      .filter((s) => s.quantity <= s.nursery.lowStockThreshold)
      .slice(0, 10)
      .map((s) => ({
        seedlingId: s.id,
        name: s.name,
        quantity: s.quantity,
        threshold: s.nursery.lowStockThreshold,
        nurseryName: s.nursery.name,
      }));

    res.json({
      success: true,
      data: {
        totalNurseries: nurseries.length,
        totalSeedlings,
        revenueThisMonth: revenueThisMonth._sum.totalAmount ?? 0,
        openIssuesCount,
        recentOrders: recentOrders.map((o) => ({
          id: o.id,
          orderNumber: o.id.slice(0, 8).toUpperCase(),
          nurseryName: o.nursery.name,
          customerName: o.customer?.name ?? o.guestName ?? 'Walk-in',
          totalAmount: o.totalAmount,
          fulfillmentStatus: o.fulfillmentStatus,
          saleMethod: o.saleMethod,
          createdAt: o.createdAt,
        })),
        lowStockSeedlings: filteredLowStock,
      },
    });
  }),
);

export default router;

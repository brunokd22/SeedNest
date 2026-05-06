import { Router } from 'express';
import { format } from 'date-fns';
import { UserRole } from '@seednest/shared';
import { requireAuth, requireRole } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../middleware/errorHandler';
import {
  getSalesAnalytics,
  exportToExcel,
  exportToPDF,
} from '../services/report.service';

const router = Router();

function parseDateParams(req: { query: Record<string, unknown> }) {
  const { dateFrom, dateTo, nurseryId } = req.query;

  if (!dateFrom || !dateTo) {
    throw new AppError('dateFrom and dateTo query parameters are required', 400);
  }

  const from = new Date(dateFrom as string);
  const to = new Date(dateTo as string);

  if (isNaN(from.getTime()) || isNaN(to.getTime())) {
    throw new AppError('Invalid date format. Use ISO date strings (e.g. 2025-01-01)', 400);
  }

  return {
    dateFrom: from,
    dateTo: to,
    nurseryId: nurseryId ? (nurseryId as string) : undefined,
  };
}

// GET /api/reports/analytics
router.get(
  '/api/reports/analytics',
  requireAuth,
  requireRole(UserRole.MANAGER),
  asyncHandler(async (req, res) => {
    const params = parseDateParams(req);
    const data = await getSalesAnalytics(req.user!.id, params);
    res.json({ success: true, data });
  }),
);

// GET /api/reports/export/excel
router.get(
  '/api/reports/export/excel',
  requireAuth,
  requireRole(UserRole.MANAGER),
  asyncHandler(async (req, res) => {
    const params = parseDateParams(req);
    const buffer = await exportToExcel(req.user!.id, params);
    const filename = `seednest-report-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }),
);

// GET /api/reports/export/pdf
router.get(
  '/api/reports/export/pdf',
  requireAuth,
  requireRole(UserRole.MANAGER),
  asyncHandler(async (req, res) => {
    const params = parseDateParams(req);
    const buffer = await exportToPDF(req.user!.id, params);
    const filename = `seednest-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }),
);

export default router;

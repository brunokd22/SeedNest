import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllRead,
} from '../services/notification.service';

const router = Router();

// NOTE: Literal-path routes registered BEFORE /:id to prevent Express from
// matching "unread-count" or "mark-all-read" as an :id parameter.

// GET /api/notifications/unread-count
router.get(
  '/api/notifications/unread-count',
  requireAuth,
  asyncHandler(async (req, res) => {
    const result = await getUnreadCount(req.user!.id);
    res.json({ success: true, data: result });
  }),
);

// PATCH /api/notifications/mark-all-read
router.patch(
  '/api/notifications/mark-all-read',
  requireAuth,
  asyncHandler(async (req, res) => {
    const result = await markAllRead(req.user!.id);
    res.json({ success: true, data: result });
  }),
);

// GET /api/notifications
router.get(
  '/api/notifications',
  requireAuth,
  asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const result = await getNotifications(req.user!.id, page, pageSize);
    res.json({ success: true, data: result });
  }),
);

// PATCH /api/notifications/:id/read
router.patch(
  '/api/notifications/:id/read',
  requireAuth,
  asyncHandler(async (req, res) => {
    const notification = await markAsRead(req.params.id as string, req.user!.id);
    res.json({ success: true, data: notification });
  }),
);

export default router;

import { Router } from 'express';
import { z } from 'zod';
import { IssueStatus, IssueType } from '@prisma/client';
import { UserRole } from '@seednest/shared';
import { requireAuth, requireRole } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../middleware/errorHandler';
import {
  createIssue,
  getIssuesByCustomer,
  getIssuesByManager,
  getIssueById,
  addComment,
  updateIssueStatus,
  reopenIssue,
} from '../services/issue.service';

const router = Router();

// ── Zod schemas ───────────────────────────────────────────────────────────────
const createIssueSchema = z.object({
  nurseryId: z.string().uuid(),
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  type: z.nativeEnum(IssueType),
  orderId: z.string().uuid().optional(),
  seedlingId: z.string().uuid().optional(),
});

const commentSchema = z.object({
  body: z.string().min(1, 'Comment body cannot be empty'),
});

const updateStatusSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']),
});

// ── Customer routes ───────────────────────────────────────────────────────────

// POST /api/issues — create issue
router.post(
  '/api/issues',
  requireAuth,
  requireRole(UserRole.CUSTOMER),
  asyncHandler(async (req, res) => {
    const parsed = createIssueSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0]?.message ?? 'Invalid request', 400);
    }
    const issue = await createIssue(req.user!.id, parsed.data);
    res.status(201).json({ success: true, data: issue });
  }),
);

// GET /api/my-issues — list customer's issues
router.get(
  '/api/my-issues',
  requireAuth,
  requireRole(UserRole.CUSTOMER),
  asyncHandler(async (req, res) => {
    const { status, page, pageSize } = req.query;
    const result = await getIssuesByCustomer(req.user!.id, {
      status: status as IssueStatus | undefined,
      page: parseInt(page as string) || 1,
      pageSize: parseInt(pageSize as string) || 10,
    });
    res.json({ success: true, data: result });
  }),
);

// GET /api/my-issues/:id — get single issue (customer)
router.get(
  '/api/my-issues/:id',
  requireAuth,
  requireRole(UserRole.CUSTOMER),
  asyncHandler(async (req, res) => {
    const issue = await getIssueById(req.params.id as string, req.user!.id, UserRole.CUSTOMER);
    res.json({ success: true, data: issue });
  }),
);

// POST /api/my-issues/:id/comments — add comment (customer)
router.post(
  '/api/my-issues/:id/comments',
  requireAuth,
  requireRole(UserRole.CUSTOMER),
  asyncHandler(async (req, res) => {
    const parsed = commentSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0]?.message ?? 'Invalid request', 400);
    }
    const comment = await addComment(req.params.id as string, req.user!.id, parsed.data.body);
    res.status(201).json({ success: true, data: comment });
  }),
);

// PATCH /api/my-issues/:id/reopen — reopen issue (customer)
router.patch(
  '/api/my-issues/:id/reopen',
  requireAuth,
  requireRole(UserRole.CUSTOMER),
  asyncHandler(async (req, res) => {
    const issue = await reopenIssue(req.params.id as string, req.user!.id);
    res.json({ success: true, data: issue });
  }),
);

// ── Manager routes ────────────────────────────────────────────────────────────

// GET /api/issues — list all issues (manager)
router.get(
  '/api/issues',
  requireAuth,
  requireRole(UserRole.MANAGER),
  asyncHandler(async (req, res) => {
    const { nurseryId, status, type, page, pageSize } = req.query;
    const result = await getIssuesByManager(req.user!.id, {
      nurseryId: nurseryId as string | undefined,
      status: status as IssueStatus | undefined,
      type: type as IssueType | undefined,
      page: parseInt(page as string) || 1,
      pageSize: parseInt(pageSize as string) || 20,
    });
    res.json({ success: true, data: result });
  }),
);

// GET /api/issues/:id — get single issue (manager)
router.get(
  '/api/issues/:id',
  requireAuth,
  requireRole(UserRole.MANAGER),
  asyncHandler(async (req, res) => {
    const issue = await getIssueById(req.params.id as string, req.user!.id, UserRole.MANAGER);
    res.json({ success: true, data: issue });
  }),
);

// POST /api/issues/:id/comments — add comment (manager)
router.post(
  '/api/issues/:id/comments',
  requireAuth,
  requireRole(UserRole.MANAGER),
  asyncHandler(async (req, res) => {
    const parsed = commentSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0]?.message ?? 'Invalid request', 400);
    }
    const comment = await addComment(req.params.id as string, req.user!.id, parsed.data.body);
    res.status(201).json({ success: true, data: comment });
  }),
);

// PATCH /api/issues/:id/status — update status (manager)
router.patch(
  '/api/issues/:id/status',
  requireAuth,
  requireRole(UserRole.MANAGER),
  asyncHandler(async (req, res) => {
    const parsed = updateStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0]?.message ?? 'Invalid status', 400);
    }
    const issue = await updateIssueStatus(
      req.params.id as string,
      req.user!.id,
      parsed.data.status as IssueStatus,
    );
    res.json({ success: true, data: issue });
  }),
);

export default router;

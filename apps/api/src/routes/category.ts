import { Router } from 'express';
import { UserRole, createCategorySchema, updateCategorySchema } from '@seednest/shared';
import type { CreateCategoryInput, UpdateCategoryInput } from '@seednest/shared';
import { requireAuth, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { checkNurseryOwnership } from '../middleware/checkNurseryOwnership';
import { asyncHandler } from '../utils/asyncHandler';
import {
  getCategoriesByNursery,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../services/category.service';

const router = Router({ mergeParams: true });

// ── Public ────────────────────────────────────────────────────────────────────
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const categories = await getCategoriesByNursery(req.params.nurseryId as string);
    res.json({ success: true, data: categories });
  }),
);

// ── Manager ───────────────────────────────────────────────────────────────────
router.post(
  '/',
  requireAuth,
  requireRole(UserRole.MANAGER),
  checkNurseryOwnership,
  validate(createCategorySchema),
  asyncHandler(async (req, res) => {
    const category = await createCategory(
      req.params.nurseryId as string,
      req.user!.id,
      req.body as CreateCategoryInput,
    );
    res.status(201).json({ success: true, data: category });
  }),
);

router.put(
  '/:id',
  requireAuth,
  requireRole(UserRole.MANAGER),
  checkNurseryOwnership,
  validate(updateCategorySchema),
  asyncHandler(async (req, res) => {
    const category = await updateCategory(
      req.params.id as string,
      req.params.nurseryId as string,
      req.user!.id,
      req.body as UpdateCategoryInput,
    );
    res.json({ success: true, data: category });
  }),
);

router.delete(
  '/:id',
  requireAuth,
  requireRole(UserRole.MANAGER),
  checkNurseryOwnership,
  asyncHandler(async (req, res) => {
    await deleteCategory(
      req.params.id as string,
      req.params.nurseryId as string,
      req.user!.id,
    );
    res.json({ success: true, data: { message: 'Category deleted' } });
  }),
);

export default router;

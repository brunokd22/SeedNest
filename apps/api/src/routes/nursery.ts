import { Router } from 'express';
import { UserRole } from '@seednest/shared';
import { createNurserySchema, updateNurserySchema } from '@seednest/shared';
import type { CreateNurseryInput, UpdateNurseryInput } from '@seednest/shared';
import { prisma } from '../config/prisma';
import { requireAuth, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import { NotFoundError } from '../middleware/errorHandler';
import {
  getAllNurseries,
  getNurseryById,
  createNursery,
  updateNursery,
  deleteNursery,
  getNurseriesForExplore,
} from '../services/nursery.service';

const router = Router();

// ── Public routes ─────────────────────────────────────────────────────────────
// /explore must be registered before /:id to avoid param swallowing
router.get(
  '/explore',
  asyncHandler(async (req, res) => {
    const rawLat = parseFloat(req.query.lat as string);
    const rawLng = parseFloat(req.query.lng as string);
    const lat = isNaN(rawLat) ? undefined : rawLat;
    const lng = isNaN(rawLng) ? undefined : rawLng;
    const nurseries = await getNurseriesForExplore(lat, lng);
    res.json({ success: true, data: nurseries });
  }),
);

router.get(
  '/:id/public',
  asyncHandler(async (req, res) => {
    const nursery = await prisma.nursery.findFirst({
      where: { id: req.params.id as string, isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        address: true,
        latitude: true,
        longitude: true,
        coverImageUrl: true,
        operatingHours: true,
      },
    });
    if (!nursery) throw new NotFoundError('Nursery not found');
    res.json({ success: true, data: nursery });
  }),
);

// ── Manager routes ────────────────────────────────────────────────────────────
router.use(requireAuth, requireRole(UserRole.MANAGER));

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const nurseries = await getAllNurseries(req.user!.id);
    res.json({ success: true, data: nurseries });
  }),
);

router.post(
  '/',
  validate(createNurserySchema),
  asyncHandler(async (req, res) => {
    const nursery = await createNursery(req.user!.id, req.body as CreateNurseryInput);
    res.status(201).json({ success: true, data: nursery });
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const nursery = await getNurseryById(req.params.id as string, req.user!.id);
    res.json({ success: true, data: nursery });
  }),
);

router.put(
  '/:id',
  validate(updateNurserySchema),
  asyncHandler(async (req, res) => {
    const nursery = await updateNursery(
      req.params.id as string,
      req.user!.id,
      req.body as UpdateNurseryInput,
    );
    res.json({ success: true, data: nursery });
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await deleteNursery(req.params.id as string, req.user!.id);
    res.json({ success: true, data: { message: 'Nursery deactivated' } });
  }),
);

export default router;

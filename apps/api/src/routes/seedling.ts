import { Router } from 'express';
import { AvailabilityStatus, SeedlingSize } from '@prisma/client';
import { UserRole, createSeedlingSchema, updateSeedlingSchema } from '@seednest/shared';
import type { CreateSeedlingInput, UpdateSeedlingInput } from '@seednest/shared';
import { requireAuth, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { checkNurseryOwnership } from '../middleware/checkNurseryOwnership';
import { asyncHandler } from '../utils/asyncHandler';
import { haversine } from '../utils/haversine';
import { prisma } from '../config/prisma';
import {
  getSeedlingsByNursery,
  getSeedlingById,
  createSeedling,
  updateSeedling,
  deleteSeedling,
} from '../services/seedling.service';

// ── Nursery-scoped router ─────────────────────────────────────────────────────
const router = Router({ mergeParams: true });

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const {
      categoryId,
      size,
      availabilityStatus,
      search,
      page: pageStr,
      pageSize: pageSizeStr,
      minPrice: minPriceStr,
      maxPrice: maxPriceStr,
    } = req.query;

    const rawMin = parseFloat(minPriceStr as string);
    const rawMax = parseFloat(maxPriceStr as string);
    const rawPage = parseInt(pageStr as string);
    const rawPageSize = parseInt(pageSizeStr as string);

    const result = await getSeedlingsByNursery(req.params.nurseryId as string, {
      categoryId: categoryId as string | undefined,
      size: size as SeedlingSize | undefined,
      availabilityStatus: availabilityStatus as AvailabilityStatus | undefined,
      search: search as string | undefined,
      minPrice: isNaN(rawMin) ? undefined : rawMin,
      maxPrice: isNaN(rawMax) ? undefined : rawMax,
      page: isNaN(rawPage) ? undefined : rawPage,
      pageSize: isNaN(rawPageSize) ? undefined : rawPageSize,
    });

    res.json({ success: true, data: result });
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const seedling = await getSeedlingById(req.params.id as string);
    res.json({ success: true, data: seedling });
  }),
);

router.post(
  '/',
  requireAuth,
  requireRole(UserRole.MANAGER),
  checkNurseryOwnership,
  validate(createSeedlingSchema),
  asyncHandler(async (req, res) => {
    const seedling = await createSeedling(
      req.params.nurseryId as string,
      req.user!.id,
      req.body as CreateSeedlingInput,
    );
    res.status(201).json({ success: true, data: seedling });
  }),
);

router.put(
  '/:id',
  requireAuth,
  requireRole(UserRole.MANAGER),
  checkNurseryOwnership,
  validate(updateSeedlingSchema),
  asyncHandler(async (req, res) => {
    const seedling = await updateSeedling(
      req.params.id as string,
      req.params.nurseryId as string,
      req.user!.id,
      req.body as UpdateSeedlingInput,
    );
    res.json({ success: true, data: seedling });
  }),
);

router.delete(
  '/:id',
  requireAuth,
  requireRole(UserRole.MANAGER),
  checkNurseryOwnership,
  asyncHandler(async (req, res) => {
    await deleteSeedling(req.params.id as string, req.params.nurseryId as string, req.user!.id);
    res.json({ success: true, data: { message: 'Seedling deleted' } });
  }),
);

// ── Global search router ──────────────────────────────────────────────────────
export const globalSeedlingRouter = Router();

globalSeedlingRouter.get(
  '/search',
  asyncHandler(async (req, res) => {
    const q = (req.query.q as string)?.trim();
    if (!q) {
      res.status(400).json({ success: false, error: 'Search query (q) is required' });
      return;
    }

    const rawLat = parseFloat(req.query.lat as string);
    const rawLng = parseFloat(req.query.lng as string);
    const lat = isNaN(rawLat) ? undefined : rawLat;
    const lng = isNaN(rawLng) ? undefined : rawLng;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;

    const seedlings = await prisma.seedling.findMany({
      where: {
        name: { contains: q, mode: 'insensitive' },
        availabilityStatus: AvailabilityStatus.AVAILABLE,
        nursery: { isActive: true },
      },
      include: {
        nursery: {
          select: { id: true, name: true, address: true, latitude: true, longitude: true },
        },
      },
    });

    type ResultItem = (typeof seedlings)[number] & {
      nursery: (typeof seedlings)[number]['nursery'] & { distanceKm?: number };
    };

    let results: ResultItem[] = seedlings as ResultItem[];

    if (lat !== undefined && lng !== undefined) {
      results = (
        seedlings.filter(
          (s): s is typeof s & { nursery: typeof s['nursery'] & { latitude: number; longitude: number } } =>
            s.nursery.latitude !== null && s.nursery.longitude !== null,
        ) as ResultItem[]
      )
        .map((s) => ({
          ...s,
          nursery: {
            ...s.nursery,
            distanceKm: haversine(lat, lng, s.nursery.latitude as number, s.nursery.longitude as number),
          },
        }))
        .sort((a, b) => (a.nursery.distanceKm ?? 0) - (b.nursery.distanceKm ?? 0));
    }

    const total = results.length;
    const data = results.slice((page - 1) * pageSize, page * pageSize);

    res.json({ success: true, data: { data, total, page, pageSize } });
  }),
);

export default router;

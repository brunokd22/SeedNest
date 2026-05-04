import { prisma } from '../config/prisma';
import { haversine } from '../utils/haversine';
import { ForbiddenError, NotFoundError } from '../middleware/errorHandler';
import type { CreateNurseryInput, UpdateNurseryInput } from '@seednest/shared';

async function assertOwnership(id: string, managerId: string) {
  const nursery = await prisma.nursery.findUnique({ where: { id } });
  if (!nursery) throw new NotFoundError('Nursery not found');
  if (nursery.managerId !== managerId) throw new ForbiddenError();
  return nursery;
}

export async function getAllNurseries(managerId: string) {
  return prisma.nursery.findMany({
    where: { managerId },
    include: { _count: { select: { seedlings: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getNurseryById(id: string, managerId: string) {
  const nursery = await prisma.nursery.findUnique({
    where: { id },
    include: {
      categories: true,
      _count: { select: { seedlings: true, orders: true } },
    },
  });
  if (!nursery) throw new NotFoundError('Nursery not found');
  if (nursery.managerId !== managerId) throw new ForbiddenError();
  return nursery;
}

export async function createNursery(managerId: string, data: CreateNurseryInput) {
  return prisma.nursery.create({
    data: { ...data, managerId },
  });
}

export async function updateNursery(
  id: string,
  managerId: string,
  data: UpdateNurseryInput,
) {
  await assertOwnership(id, managerId);
  return prisma.nursery.update({ where: { id }, data });
}

export async function deleteNursery(id: string, managerId: string): Promise<void> {
  await assertOwnership(id, managerId);
  await prisma.nursery.update({ where: { id }, data: { isActive: false } });
}

export async function getNurseriesForExplore(lat?: number, lng?: number) {
  const nurseries = await prisma.nursery.findMany({
    where: { isActive: true },
    include: {
      categories: { select: { id: true, name: true } },
      _count: { select: { seedlings: true } },
    },
    orderBy: lat === undefined ? { createdAt: 'desc' } : undefined,
  });

  if (lat !== undefined && lng !== undefined) {
    return nurseries
      .filter(
        (n): n is typeof n & { latitude: number; longitude: number } =>
          n.latitude !== null && n.longitude !== null,
      )
      .map((n) => ({ ...n, distanceKm: haversine(lat, lng, n.latitude, n.longitude) }))
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }

  return nurseries;
}

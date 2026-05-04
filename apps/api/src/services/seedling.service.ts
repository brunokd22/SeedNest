import { NotificationType, Prisma, SeedlingSize, AvailabilityStatus } from '@prisma/client';
import { prisma } from '../config/prisma';
import { ForbiddenError, NotFoundError } from '../middleware/errorHandler';
import { sendLowStockAlert } from '../config/resend';
import { createNotification } from './notification.service';
import type { CreateSeedlingInput, UpdateSeedlingInput, PaginatedResponse } from '@seednest/shared';

type SeedlingWithCategory = Prisma.SeedlingGetPayload<{
  include: { category: { select: { id: true; name: true } } };
}>;

type SeedlingDetail = Prisma.SeedlingGetPayload<{
  include: {
    category: true;
    nursery: { select: { id: true; name: true; address: true; managerId: true } };
  };
}>;

async function assertSeedlingOwnership(id: string, nurseryId: string, managerId: string) {
  const seedling = await prisma.seedling.findFirst({
    where: { id, nurseryId },
    include: { nursery: { select: { managerId: true } } },
  });
  if (!seedling) throw new NotFoundError('Seedling not found');
  if (seedling.nursery.managerId !== managerId) throw new ForbiddenError();
  return seedling;
}

export async function getSeedlingsByNursery(
  nurseryId: string,
  filters: {
    categoryId?: string;
    size?: SeedlingSize;
    availabilityStatus?: AvailabilityStatus;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    page?: number;
    pageSize?: number;
  },
): Promise<PaginatedResponse<SeedlingWithCategory>> {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;
  const skip = (page - 1) * pageSize;

  const where: Prisma.SeedlingWhereInput = {
    nurseryId,
    ...(filters.categoryId && { categoryId: filters.categoryId }),
    ...(filters.size && { size: filters.size }),
    ...(filters.availabilityStatus && { availabilityStatus: filters.availabilityStatus }),
    ...(filters.search && { name: { contains: filters.search, mode: 'insensitive' } }),
    ...((filters.minPrice !== undefined || filters.maxPrice !== undefined) && {
      price: {
        ...(filters.minPrice !== undefined && { gte: filters.minPrice }),
        ...(filters.maxPrice !== undefined && { lte: filters.maxPrice }),
      },
    }),
  };

  const [data, total] = await prisma.$transaction([
    prisma.seedling.findMany({
      where,
      include: { category: { select: { id: true, name: true } } },
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.seedling.count({ where }),
  ]);

  return { data, total, page, pageSize };
}

export async function getSeedlingById(id: string): Promise<SeedlingDetail> {
  const seedling = await prisma.seedling.findUnique({
    where: { id },
    include: {
      category: true,
      nursery: { select: { id: true, name: true, address: true, managerId: true } },
    },
  });
  if (!seedling) throw new NotFoundError('Seedling not found');
  return seedling;
}

export async function createSeedling(
  nurseryId: string,
  managerId: string,
  data: CreateSeedlingInput,
) {
  const nursery = await prisma.nursery.findUnique({ where: { id: nurseryId } });
  if (!nursery) throw new NotFoundError('Nursery not found');
  if (nursery.managerId !== managerId) throw new ForbiddenError();
  return prisma.seedling.create({ data: { nurseryId, ...data } });
}

export async function updateSeedling(
  id: string,
  nurseryId: string,
  managerId: string,
  data: UpdateSeedlingInput,
) {
  await assertSeedlingOwnership(id, nurseryId, managerId);
  const updated = await prisma.seedling.update({ where: { id }, data });
  await checkAndNotifyLowStock(id, nurseryId);
  return updated;
}

export async function deleteSeedling(
  id: string,
  nurseryId: string,
  managerId: string,
): Promise<void> {
  await assertSeedlingOwnership(id, nurseryId, managerId);
  await prisma.seedling.delete({ where: { id } });
}

export async function checkAndNotifyLowStock(
  seedlingId: string,
  _nurseryId: string,
): Promise<void> {
  try {
    const seedling = await prisma.seedling.findUnique({
      where: { id: seedlingId },
      include: {
        nursery: {
          select: {
            id: true,
            name: true,
            managerId: true,
            lowStockThreshold: true,
            manager: { select: { email: true, name: true } },
          },
        },
      },
    });
    if (!seedling?.nursery) return;
    if (seedling.quantity <= seedling.nursery.lowStockThreshold) {
      await createNotification({
        userId: seedling.nursery.managerId,
        type: NotificationType.LOW_STOCK,
        title: 'Low Stock Alert',
        message: `${seedling.name} has only ${seedling.quantity} units left in ${seedling.nursery.name}`,
        relatedId: seedlingId,
      });
      await sendLowStockAlert(
        seedling.nursery.manager.email,
        seedling.nursery.manager.name,
        seedling.name,
        seedling.quantity,
        seedling.nursery.name,
      );
    }
  } catch (err) {
    console.error('Low stock notification failed:', err);
  }
}

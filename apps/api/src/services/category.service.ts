import { prisma } from '../config/prisma';
import { AppError, ForbiddenError, NotFoundError } from '../middleware/errorHandler';
import type { CreateCategoryInput, UpdateCategoryInput } from '@seednest/shared';

async function assertNurseryOwnership(nurseryId: string, managerId: string) {
  const nursery = await prisma.nursery.findUnique({ where: { id: nurseryId } });
  if (!nursery) throw new NotFoundError('Nursery not found');
  if (nursery.managerId !== managerId) throw new ForbiddenError('Not your nursery');
}

export async function getCategoriesByNursery(nurseryId: string) {
  return prisma.category.findMany({
    where: { nurseryId },
    include: { _count: { select: { seedlings: true } } },
    orderBy: { name: 'asc' },
  });
}

export async function createCategory(
  nurseryId: string,
  managerId: string,
  data: CreateCategoryInput,
) {
  await assertNurseryOwnership(nurseryId, managerId);
  return prisma.category.create({ data: { nurseryId, ...data } });
}

export async function updateCategory(
  id: string,
  nurseryId: string,
  managerId: string,
  data: UpdateCategoryInput,
) {
  await assertNurseryOwnership(nurseryId, managerId);
  const category = await prisma.category.findFirst({ where: { id, nurseryId } });
  if (!category) throw new NotFoundError('Category not found');
  return prisma.category.update({ where: { id }, data });
}

export async function deleteCategory(
  id: string,
  nurseryId: string,
  managerId: string,
): Promise<void> {
  await assertNurseryOwnership(nurseryId, managerId);
  const category = await prisma.category.findFirst({ where: { id, nurseryId } });
  if (!category) throw new NotFoundError('Category not found');
  const seedlingCount = await prisma.seedling.count({ where: { categoryId: id } });
  if (seedlingCount > 0) {
    throw new AppError('Cannot delete category with existing seedlings', 400);
  }
  await prisma.category.delete({ where: { id } });
}

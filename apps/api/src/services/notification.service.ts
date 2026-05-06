import { NotificationType } from '@prisma/client';
import type { PaginatedResponse } from '@seednest/shared';
import { prisma } from '../config/prisma';
import { ForbiddenError, NotFoundError } from '../middleware/errorHandler';

// ── createNotification ────────────────────────────────────────────────────────
// Single shared function — all services import this instead of calling
// prisma.notification.create(...) directly.
export async function createNotification(data: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedId?: string;
}) {
  return prisma.notification.create({ data });
}

// ── getNotifications ──────────────────────────────────────────────────────────
export async function getNotifications(
  userId: string,
  page: number,
  pageSize: number,
): Promise<PaginatedResponse<object>> {
  const skip = (page - 1) * pageSize;
  const where = { userId };

  const [data, total] = await prisma.$transaction([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.notification.count({ where }),
  ]);

  return {
    data,
    total,
    page,
    pageSize,
  };
}

// ── getUnreadCount ────────────────────────────────────────────────────────────
export async function getUnreadCount(userId: string): Promise<{ count: number }> {
  const count = await prisma.notification.count({
    where: { userId, isRead: false },
  });
  return { count };
}

// ── markAsRead ────────────────────────────────────────────────────────────────
export async function markAsRead(notificationId: string, userId: string) {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification) throw new NotFoundError('Notification not found');
  if (notification.userId !== userId) throw new ForbiddenError();

  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
}

// ── markAllRead ───────────────────────────────────────────────────────────────
export async function markAllRead(userId: string): Promise<{ updatedCount: number }> {
  const result = await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
  return { updatedCount: result.count };
}

import { NotificationType } from '@prisma/client';
import { prisma } from '../config/prisma';

export async function createNotification(data: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedId?: string;
}) {
  return prisma.notification.create({ data });
}

import { IssueStatus, IssueType, NotificationType } from '@prisma/client';
import { UserRole } from '@seednest/shared';
import type { PaginatedResponse } from '@seednest/shared';
import { prisma } from '../config/prisma';
import { AppError, ForbiddenError, NotFoundError } from '../middleware/errorHandler';
import { createNotification } from './notification.service';
import {
  sendIssueNotificationEmail,
  sendIssueReplyEmail,
} from '../config/resend';

// ── createIssue ───────────────────────────────────────────────────────────────
export async function createIssue(
  customerId: string,
  data: {
    nurseryId: string;
    title: string;
    description: string;
    type: IssueType;
    orderId?: string;
    seedlingId?: string;
  },
) {
  // 1. Verify order ownership if provided
  if (data.orderId) {
    const order = await prisma.order.findUnique({ where: { id: data.orderId } });
    if (!order) throw new NotFoundError('Order not found');
    if (order.customerId !== customerId) throw new ForbiddenError();
  }

  // 2. Create the issue
  const issue = await prisma.issue.create({
    data: {
      customerId,
      nurseryId: data.nurseryId,
      title: data.title,
      description: data.description,
      type: data.type,
      status: IssueStatus.OPEN,
      orderId: data.orderId ?? null,
      seedlingId: data.seedlingId ?? null,
    },
  });

  // 3. Notify manager (non-blocking)
  (async () => {
    try {
      const nursery = await prisma.nursery.findUnique({
        where: { id: data.nurseryId },
        include: { manager: { select: { id: true, name: true, email: true } } },
      });
      const customer = await prisma.user.findUnique({
        where: { id: customerId },
        select: { name: true },
      });
      if (!nursery || !customer) return;

      await createNotification({
        userId: nursery.managerId,
        type: NotificationType.NEW_ISSUE,
        title: `New Issue: ${data.title}`,
        message: `${customer.name} raised a ${data.type.replace(/_/g, ' ').toLowerCase()}: ${data.title}`,
        relatedId: issue.id,
      });

      await sendIssueNotificationEmail(
        nursery.manager.email,
        nursery.manager.name,
        data.title,
        customer.name,
        `${process.env.FRONTEND_URL}/dashboard/issues/${issue.id}`,
      );
    } catch (err) {
      console.error('createIssue notification failed:', err);
    }
  })();

  return issue;
}

// ── getIssuesByCustomer ───────────────────────────────────────────────────────
export async function getIssuesByCustomer(
  customerId: string,
  filters: { status?: IssueStatus; page: number; pageSize: number },
): Promise<PaginatedResponse<object>> {
  const skip = (filters.page - 1) * filters.pageSize;
  const where = {
    customerId,
    ...(filters.status && { status: filters.status }),
  };

  const [data, total] = await prisma.$transaction([
    prisma.issue.findMany({
      where,
      include: {
        _count: { select: { comments: true } },
        nursery: { select: { name: true } },
        order: { select: { id: true } },
      },
      orderBy: { updatedAt: 'desc' },
      skip,
      take: filters.pageSize,
    }),
    prisma.issue.count({ where }),
  ]);

  return { data, total, page: filters.page, pageSize: filters.pageSize };
}

// ── getIssuesByManager ────────────────────────────────────────────────────────
export async function getIssuesByManager(
  managerId: string,
  filters: {
    nurseryId?: string;
    status?: IssueStatus;
    type?: IssueType;
    page: number;
    pageSize: number;
  },
): Promise<PaginatedResponse<object>> {
  const skip = (filters.page - 1) * filters.pageSize;

  const nurseries = await prisma.nursery.findMany({
    where: { managerId },
    select: { id: true },
  });
  const nurseryIds = nurseries.map((n) => n.id);

  if (filters.nurseryId && !nurseryIds.includes(filters.nurseryId)) {
    throw new ForbiddenError();
  }

  const targetIds = filters.nurseryId ? [filters.nurseryId] : nurseryIds;

  const where = {
    nurseryId: { in: targetIds },
    ...(filters.status && { status: filters.status }),
    ...(filters.type && { type: filters.type }),
  };

  const [issues, total] = await prisma.$transaction([
    prisma.issue.findMany({
      where,
      include: {
        customer: { select: { name: true, email: true } },
        nursery: { select: { name: true } },
        _count: { select: { comments: true } },
        comments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { body: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
      skip,
      take: filters.pageSize,
    }),
    prisma.issue.count({ where }),
  ]);

  const data = issues.map((issue) => ({
    ...issue,
    latestCommentPreview: issue.comments[0]?.body?.slice(0, 100) ?? null,
    comments: undefined,
  }));

  return { data, total, page: filters.page, pageSize: filters.pageSize };
}

// ── getIssueById ──────────────────────────────────────────────────────────────
export async function getIssueById(
  issueId: string,
  requesterId: string,
  requesterRole: UserRole,
) {
  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    include: {
      comments: {
        orderBy: { createdAt: 'asc' },
        include: {
          author: { select: { name: true, image: true, role: true } },
        },
      },
      customer: { select: { name: true, email: true, createdAt: true } },
      nursery: { select: { name: true, id: true, managerId: true } },
      order: { select: { id: true } },
      seedling: { select: { name: true, id: true } },
    },
  });

  if (!issue) throw new NotFoundError('Issue not found');

  if (requesterRole === UserRole.MANAGER) {
    if (issue.nursery.managerId !== requesterId) throw new ForbiddenError();
  } else if (requesterRole === UserRole.CUSTOMER) {
    if (issue.customerId !== requesterId) throw new ForbiddenError();
  }

  return issue;
}

// ── addComment ────────────────────────────────────────────────────────────────
export async function addComment(
  issueId: string,
  authorId: string,
  body: string,
) {
  // Fetch issue with ownership info
  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    include: {
      nursery: { select: { managerId: true, name: true } },
      customer: { select: { id: true, name: true, email: true } },
    },
  });

  if (!issue) throw new NotFoundError('Issue not found');

  const isCustomer = authorId === issue.customerId;
  const isManager = authorId === issue.nursery.managerId;
  if (!isCustomer && !isManager) throw new ForbiddenError();

  // Create comment
  const comment = await prisma.issueComment.create({
    data: { issueId, authorId, body },
    include: { author: { select: { name: true, image: true, role: true } } },
  });

  // Bump issue updatedAt
  await prisma.issue.update({
    where: { id: issueId },
    data: { updatedAt: new Date() },
  });

  // Notify other party (non-blocking)
  (async () => {
    try {
      const preview = body.slice(0, 80);
      const issueUrl = `${process.env.FRONTEND_URL}/dashboard/issues/${issueId}`;

      if (isCustomer) {
        // Notify manager
        await createNotification({
          userId: issue.nursery.managerId,
          type: NotificationType.NEW_COMMENT,
          title: `New Reply: ${issue.title}`,
          message: preview,
          relatedId: issueId,
        });
        const manager = await prisma.user.findUnique({
          where: { id: issue.nursery.managerId },
          select: { email: true, name: true },
        });
        if (manager) {
          await sendIssueReplyEmail(
            manager.email,
            manager.name,
            issue.title,
            preview,
            issueUrl,
          );
        }
      } else {
        // Notify customer
        await createNotification({
          userId: issue.customerId,
          type: NotificationType.NEW_COMMENT,
          title: `New Reply: ${issue.title}`,
          message: preview,
          relatedId: issueId,
        });
        if (issue.customer) {
          await sendIssueReplyEmail(
            issue.customer.email,
            issue.customer.name,
            issue.title,
            preview,
            `${process.env.FRONTEND_URL}/my-issues/${issueId}`,
          );
        }
      }
    } catch (err) {
      console.error('addComment notification failed:', err);
    }
  })();

  return comment;
}

// ── updateIssueStatus ─────────────────────────────────────────────────────────
export async function updateIssueStatus(
  issueId: string,
  managerId: string,
  status: IssueStatus,
) {
  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    include: {
      nursery: { select: { managerId: true, name: true } },
      customer: { select: { id: true, name: true, email: true } },
    },
  });

  if (!issue) throw new NotFoundError('Issue not found');
  if (issue.nursery.managerId !== managerId) throw new ForbiddenError();

  const updated = await prisma.issue.update({
    where: { id: issueId },
    data: { status },
  });

  // Notify customer on resolve/close (non-blocking)
  if (status === IssueStatus.RESOLVED || status === IssueStatus.CLOSED) {
    (async () => {
      try {
        const label = status === IssueStatus.RESOLVED ? 'Resolved' : 'Closed';
        await createNotification({
          userId: issue.customerId,
          type: NotificationType.NEW_COMMENT,
          title: `Issue ${label}: ${issue.title}`,
          message: `Your issue has been marked as ${label.toLowerCase()} by the nursery.`,
          relatedId: issueId,
        });
        if (issue.customer) {
          await sendIssueReplyEmail(
            issue.customer.email,
            issue.customer.name,
            issue.title,
            `Your issue has been marked as ${label.toLowerCase()} by ${issue.nursery.name}.`,
            `${process.env.FRONTEND_URL}/my-issues/${issueId}`,
          );
        }
      } catch (err) {
        console.error('updateIssueStatus notification failed:', err);
      }
    })();
  }

  return updated;
}

// ── reopenIssue ───────────────────────────────────────────────────────────────
export async function reopenIssue(issueId: string, customerId: string) {
  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    include: {
      nursery: { select: { managerId: true } },
    },
  });

  if (!issue) throw new NotFoundError('Issue not found');
  if (issue.customerId !== customerId) throw new ForbiddenError();

  if (
    issue.status !== IssueStatus.RESOLVED &&
    issue.status !== IssueStatus.CLOSED
  ) {
    throw new AppError('Issue cannot be reopened from its current status', 400);
  }

  const updated = await prisma.issue.update({
    where: { id: issueId },
    data: { status: IssueStatus.OPEN },
  });

  // Notify manager (non-blocking)
  (async () => {
    try {
      const customer = await prisma.user.findUnique({
        where: { id: customerId },
        select: { name: true },
      });
      await createNotification({
        userId: issue.nursery.managerId,
        type: NotificationType.NEW_ISSUE,
        title: `Issue Reopened: ${issue.title}`,
        message: `${customer?.name ?? 'Customer'} has reopened this issue.`,
        relatedId: issueId,
      });
    } catch (err) {
      console.error('reopenIssue notification failed:', err);
    }
  })();

  return updated;
}

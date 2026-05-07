'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { PaginatedResponse } from '@seednest/shared';

export type Notification = {
  id: string;
  userId: string;
  type: 'NEW_ISSUE' | 'NEW_COMMENT' | 'LOW_STOCK' | 'ORDER_UPDATE';
  title: string;
  message: string;
  isRead: boolean;
  relatedId: string | null;
  createdAt: string;
};

type ApiOk<T> = { success: boolean; data: T };

export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const { data } = await api.get<ApiOk<{ count: number }>>(
        '/api/notifications/unread-count',
      );
      return data.data;
    },
    refetchInterval: 30_000,
    staleTime: 0,
  });
}

export function useNotifications(page: number, pageSize = 20) {
  return useQuery({
    queryKey: ['notifications', page, pageSize],
    queryFn: async () => {
      const { data } = await api.get<ApiOk<PaginatedResponse<Notification>>>(
        `/api/notifications?page=${page}&pageSize=${pageSize}`,
      );
      return data.data;
    },
  });
}

export function useMarkAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { data } = await api.patch<ApiOk<Notification>>(
        `/api/notifications/${notificationId}/read`,
      );
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.patch<ApiOk<{ updatedCount: number }>>(
        '/api/notifications/mark-all-read',
      );
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type MobileNotification = {
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
    queryKey: ['mobile-notifications-unread'],
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

export function useNotifications(pageSize = 50) {
  return useQuery({
    queryKey: ['mobile-notifications', pageSize],
    queryFn: async () => {
      const { data } = await api.get<ApiOk<{ data: MobileNotification[]; total: number }>>(
        `/api/notifications?page=1&pageSize=${pageSize}`,
      );
      return data.data;
    },
  });
}

export function useMarkAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/api/notifications/${id}/read`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mobile-notifications'] });
      qc.invalidateQueries({ queryKey: ['mobile-notifications-unread'] });
    },
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.patch('/api/notifications/mark-all-read');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mobile-notifications'] });
      qc.invalidateQueries({ queryKey: ['mobile-notifications-unread'] });
    },
  });
}

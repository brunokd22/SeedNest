'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import type { PaginatedResponse } from '@seednest/shared';

// ── Types ─────────────────────────────────────────────────────────────────────
export type ManagerOrderItem = {
  id: string;
  seedlingId: string;
  seedlingName: string;
  seedlingSize: string;
  unitPrice: number;
  quantity: number;
  seedling?: { id: string; name: string; photos: string[] } | null;
};

export type ManagerOrder = {
  id: string;
  createdAt: string;
  totalAmount: number;
  fulfillmentType: string;
  fulfillmentStatus: string;
  deliveryAddress: string | null;
  saleMethod: string;
  guestName: string | null;
  stripePaymentIntentId: string | null;
  nurseryId: string;
  customerId: string | null;
  nursery: { id: string; name: string; address: string };
  customer: { id: string; name: string; email: string } | null;
  items: ManagerOrderItem[];
  _count?: { items: number };
};

export type CreateWalkinOrderPayload = {
  nurseryId: string;
  items: { seedlingId: string; quantity: number }[];
  guestName?: string;
  customerId?: string;
  notes?: string;
};

type ApiOk<T> = { success: boolean; data: T };

// ── Hooks ─────────────────────────────────────────────────────────────────────
export function useManagerOrders(filters: {
  nurseryId?: string;
  dateFrom?: string;
  dateTo?: string;
  fulfillmentStatus?: string;
  saleMethod?: string;
  page?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: ['manager-orders', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.nurseryId) params.set('nurseryId', filters.nurseryId);
      if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.set('dateTo', filters.dateTo);
      if (filters.fulfillmentStatus) params.set('fulfillmentStatus', filters.fulfillmentStatus);
      if (filters.saleMethod) params.set('saleMethod', filters.saleMethod);
      if (filters.page) params.set('page', String(filters.page));
      if (filters.pageSize) params.set('pageSize', String(filters.pageSize));
      const { data } = await api.get<ApiOk<PaginatedResponse<ManagerOrder>>>(
        `/api/orders?${params}`,
      );
      return data.data;
    },
  });
}

export function useManagerOrder(orderId: string) {
  return useQuery({
    queryKey: ['manager-order', orderId],
    queryFn: async () => {
      const { data } = await api.get<ApiOk<ManagerOrder>>(`/api/orders/${orderId}`);
      return data.data;
    },
    enabled: !!orderId,
  });
}

export function useUpdateFulfillmentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      orderId,
      fulfillmentStatus,
    }: {
      orderId: string;
      fulfillmentStatus: string;
    }) => {
      const { data } = await api.patch<ApiOk<ManagerOrder>>(
        `/api/orders/${orderId}/status`,
        { fulfillmentStatus },
      );
      return data.data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['manager-orders'] });
      qc.invalidateQueries({ queryKey: ['manager-order', data.id] });
      toast.success('Status updated');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useCreateWalkinOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateWalkinOrderPayload) => {
      const { data } = await api.post<ApiOk<ManagerOrder>>('/api/orders/walkin', payload);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['manager-orders'] });
      qc.invalidateQueries({ queryKey: ['nurseries'] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

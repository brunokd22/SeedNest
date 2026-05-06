'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { PaginatedResponse } from '@seednest/shared';

export type OrderItem = {
  id: string;
  seedlingId: string;
  seedlingName: string;
  seedlingSize: string;
  unitPrice: number;
  quantity: number;
  seedling?: { id: string; name: string; photos: string[] } | null;
};

export type MyOrder = {
  id: string;
  createdAt: string;
  totalAmount: number;
  fulfillmentType: string;
  fulfillmentStatus: string;
  fulfillmentType2?: string;
  deliveryAddress: string | null;
  saleMethod: string;
  nurseryId: string;
  nursery: { id: string; name: string; address: string };
  customer: { id: string; name: string; email: string } | null;
  items: OrderItem[];
};

type ApiOk<T> = { success: boolean; data: T };

export function useMyOrders(
  page: number,
  pageSize: number,
  fulfillmentStatus?: string,
) {
  return useQuery({
    queryKey: ['my-orders', page, pageSize, fulfillmentStatus],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (fulfillmentStatus) params.set('fulfillmentStatus', fulfillmentStatus);
      const { data } = await api.get<ApiOk<PaginatedResponse<MyOrder>>>(
        `/api/my-orders?${params}`,
      );
      return data.data;
    },
  });
}

export function useMyOrder(orderId: string) {
  return useQuery({
    queryKey: ['my-order', orderId],
    queryFn: async () => {
      const { data } = await api.get<ApiOk<MyOrder>>(`/api/my-orders/${orderId}`);
      return data.data;
    },
    enabled: !!orderId,
  });
}

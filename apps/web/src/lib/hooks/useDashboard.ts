'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type DashboardOrder = {
  id: string;
  orderNumber: string;
  nurseryName: string;
  customerName: string;
  totalAmount: number;
  fulfillmentStatus: string;
  saleMethod: string;
  createdAt: string;
};

export type LowStockItem = {
  seedlingId: string;
  name: string;
  quantity: number;
  threshold: number;
  nurseryName: string;
};

export type DashboardStats = {
  totalNurseries: number;
  totalSeedlings: number;
  revenueThisMonth: number;
  openIssuesCount: number;
  recentOrders: DashboardOrder[];
  lowStockSeedlings: LowStockItem[];
};

type ApiOk<T> = { success: boolean; data: T };

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data } = await api.get<ApiOk<DashboardStats>>('/api/dashboard/stats');
      return data.data;
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

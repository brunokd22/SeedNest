'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type SalesAnalyticsResult = {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  revenueByDay: { date: string; revenue: number; orders: number }[];
  revenueByNursery: { nurseryId: string; nurseryName: string; revenue: number; orders: number }[];
  topSeedlings: { seedlingId: string; name: string; totalSold: number; revenue: number }[];
  ordersByFulfillmentType: { type: string; count: number }[];
  ordersBySaleMethod: { method: string; count: number }[];
};

type ApiOk<T> = { success: boolean; data: T };

export function useAnalytics(params: {
  dateFrom: string | null;
  dateTo: string | null;
  nurseryId?: string;
}) {
  return useQuery({
    queryKey: ['analytics', params],
    queryFn: async () => {
      const p = new URLSearchParams({
        dateFrom: params.dateFrom!,
        dateTo: params.dateTo!,
      });
      if (params.nurseryId) p.set('nurseryId', params.nurseryId);
      const { data } = await api.get<ApiOk<SalesAnalyticsResult>>(
        `/api/reports/analytics?${p}`,
      );
      return data.data;
    },
    enabled: !!params.dateFrom && !!params.dateTo,
  });
}

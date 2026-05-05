'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { SeedlingSize, AvailabilityStatus } from '@seednest/shared';
import type { CreateSeedlingInput, UpdateSeedlingInput, PaginatedResponse } from '@seednest/shared';

export type Seedling = {
  id: string;
  nurseryId: string;
  categoryId: string | null;
  name: string;
  description: string | null;
  size: SeedlingSize;
  price: number;
  quantity: number;
  availabilityStatus: AvailabilityStatus;
  photos: string[];
  createdAt: string;
  updatedAt: string;
  category?: { id: string; name: string } | null;
};

export type SeedlingFilters = {
  categoryId?: string;
  size?: string;
  availabilityStatus?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  pageSize?: number;
};

type ApiResponse<T> = { success: boolean; data: T };

export function useSeedlingsByNursery(nurseryId: string, filters: SeedlingFilters) {
  return useQuery({
    queryKey: ['seedlings', nurseryId, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.categoryId) params.set('categoryId', filters.categoryId);
      if (filters.size) params.set('size', filters.size);
      if (filters.availabilityStatus) params.set('availabilityStatus', filters.availabilityStatus);
      if (filters.search) params.set('search', filters.search);
      if (filters.minPrice != null) params.set('minPrice', String(filters.minPrice));
      if (filters.maxPrice != null) params.set('maxPrice', String(filters.maxPrice));
      if (filters.page != null) params.set('page', String(filters.page));
      if (filters.pageSize != null) params.set('pageSize', String(filters.pageSize));
      const { data } = await api.get<ApiResponse<PaginatedResponse<Seedling>>>(
        `/api/nurseries/${nurseryId}/seedlings?${params}`,
      );
      return data.data;
    },
    enabled: !!nurseryId,
  });
}

export function useSeedling(nurseryId: string, seedlingId: string) {
  return useQuery({
    queryKey: ['seedling', nurseryId, seedlingId],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Seedling>>(
        `/api/nurseries/${nurseryId}/seedlings/${seedlingId}`,
      );
      return data;
    },
    enabled: !!nurseryId && !!seedlingId,
  });
}

export function useCreateSeedling(nurseryId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateSeedlingInput) => {
      const { data } = await api.post<ApiResponse<Seedling>>(
        `/api/nurseries/${nurseryId}/seedlings`,
        input,
      );
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['seedlings', nurseryId] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useUpdateSeedling(nurseryId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string } & UpdateSeedlingInput) => {
      const { data } = await api.put<ApiResponse<Seedling>>(
        `/api/nurseries/${nurseryId}/seedlings/${id}`,
        input,
      );
      return data.data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['seedlings', nurseryId] });
      qc.invalidateQueries({ queryKey: ['seedling', nurseryId, data.id] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useDeleteSeedling(nurseryId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/nurseries/${nurseryId}/seedlings/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['seedlings', nurseryId] });
      toast.success('Seedling deleted');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { CreateCategoryInput, UpdateCategoryInput } from '@seednest/shared';

export type Category = {
  id: string;
  nurseryId: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { seedlings: number };
};

type ApiResponse<T> = { success: boolean; data: T };

export function useCategoriesByNursery(nurseryId: string) {
  return useQuery({
    queryKey: ['categories', nurseryId],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Category[]>>(
        `/api/nurseries/${nurseryId}/categories`,
      );
      return data.data;
    },
    enabled: !!nurseryId,
  });
}

export function useCreateCategory(nurseryId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateCategoryInput) => {
      const { data } = await api.post<ApiResponse<Category>>(
        `/api/nurseries/${nurseryId}/categories`,
        input,
      );
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories', nurseryId] });
    },
    onError: (err: Error) => {
      qc.invalidateQueries({ queryKey: ['categories', nurseryId] });
      throw err;
    },
  });
}

export function useUpdateCategory(nurseryId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string } & UpdateCategoryInput) => {
      const { data } = await api.put<ApiResponse<Category>>(
        `/api/nurseries/${nurseryId}/categories/${id}`,
        input,
      );
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories', nurseryId] });
    },
  });
}

export function useDeleteCategory(nurseryId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/nurseries/${nurseryId}/categories/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories', nurseryId] });
    },
  });
}

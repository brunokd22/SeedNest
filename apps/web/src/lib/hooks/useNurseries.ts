'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import type { CreateNurseryInput, UpdateNurseryInput } from '@seednest/shared';

export type Nursery = {
  id: string;
  name: string;
  description: string | null;
  address: string;
  latitude: number | null;
  longitude: number | null;
  coverImageUrl: string | null;
  operatingHours: string | null;
  lowStockThreshold: number;
  careReminderDays: number;
  isActive: boolean;
  managerId: string;
  createdAt: string;
  updatedAt: string;
  _count?: { seedlings: number; orders?: number };
  categories?: { id: string; name: string }[];
};

type ApiResponse<T> = { success: boolean; data: T };

export function useNurseries() {
  return useQuery({
    queryKey: ['nurseries'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Nursery[]>>('/api/nurseries');
      return data.data;
    },
  });
}

export function useNursery(id: string) {
  return useQuery({
    queryKey: ['nurseries', id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Nursery>>(`/api/nurseries/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateNursery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateNurseryInput) => {
      const { data } = await api.post<ApiResponse<Nursery>>('/api/nurseries', input);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nurseries'] });
      toast.success('Nursery created!');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useUpdateNursery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string } & UpdateNurseryInput) => {
      const { data } = await api.put<ApiResponse<Nursery>>(`/api/nurseries/${id}`, input);
      return data.data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['nurseries', data.id] });
      qc.invalidateQueries({ queryKey: ['nurseries'] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useDeleteNursery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/nurseries/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nurseries'] });
      toast.success('Nursery deactivated');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AvailabilityStatus, SeedlingSize } from '@seednest/shared';
import type { PaginatedResponse } from '@seednest/shared';

// ── Types ─────────────────────────────────────────────────────────────────────
export type ExploreNursery = {
  id: string;
  name: string;
  description: string | null;
  address: string;
  coverImageUrl: string | null;
  operatingHours: string | null;
  latitude: number | null;
  longitude: number | null;
  isActive: boolean;
  distanceKm?: number;
  categories?: { id: string; name: string }[];
  _count?: { seedlings: number };
};

export type PublicNursery = {
  id: string;
  name: string;
  description: string | null;
  address: string;
  latitude: number | null;
  longitude: number | null;
  coverImageUrl: string | null;
  operatingHours: string | null;
};

export type PublicSeedling = {
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

export type PublicSeedlingFilters = {
  categoryId?: string;
  size?: string;
  availabilityStatus?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  pageSize?: number;
};

type ApiOk<T> = { success: boolean; data: T };

// ── Hooks ─────────────────────────────────────────────────────────────────────
export function useNurseriesExplore(lat?: number, lng?: number) {
  return useQuery({
    queryKey: ['nurseries-explore', lat, lng],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (lat != null) params.set('lat', String(lat));
      if (lng != null) params.set('lng', String(lng));
      const qs = params.toString();
      const { data } = await api.get<ApiOk<ExploreNursery[]>>(
        `/api/nurseries/explore${qs ? `?${qs}` : ''}`,
      );
      return data.data;
    },
  });
}

export function usePublicNursery(nurseryId: string) {
  return useQuery({
    queryKey: ['public-nursery', nurseryId],
    queryFn: async () => {
      const { data } = await api.get<ApiOk<PublicNursery>>(
        `/api/nurseries/${nurseryId}/public`,
      );
      return data.data;
    },
    enabled: !!nurseryId,
  });
}

export function usePublicSeedlings(nurseryId: string, filters: PublicSeedlingFilters) {
  return useQuery({
    queryKey: ['public-seedlings', nurseryId, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.categoryId) params.set('categoryId', filters.categoryId);
      if (filters.size) params.set('size', filters.size);
      if (filters.availabilityStatus)
        params.set('availabilityStatus', filters.availabilityStatus);
      if (filters.search) params.set('search', filters.search);
      if (filters.minPrice != null) params.set('minPrice', String(filters.minPrice));
      if (filters.maxPrice != null) params.set('maxPrice', String(filters.maxPrice));
      if (filters.page != null) params.set('page', String(filters.page));
      if (filters.pageSize != null) params.set('pageSize', String(filters.pageSize));
      const { data } = await api.get<ApiOk<PaginatedResponse<PublicSeedling>>>(
        `/api/nurseries/${nurseryId}/seedlings?${params}`,
      );
      return data.data;
    },
    enabled: !!nurseryId,
  });
}

export function usePublicSeedling(nurseryId: string, seedlingId: string) {
  return useQuery({
    queryKey: ['public-seedling', nurseryId, seedlingId],
    queryFn: async () => {
      const { data } = await api.get<ApiOk<PublicSeedling>>(
        `/api/nurseries/${nurseryId}/seedlings/${seedlingId}`,
      );
      return data.data;
    },
    enabled: !!nurseryId && !!seedlingId,
  });
}

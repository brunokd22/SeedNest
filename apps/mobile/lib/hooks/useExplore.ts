import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { PaginatedResponse } from '@seednest/shared';
import { AvailabilityStatus, SeedlingSize } from '@seednest/shared';

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

export type MobileSeedling = {
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

type ApiOk<T> = { success: boolean; data: T };

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

export function usePublicSeedlings(
  nurseryId: string,
  filters: Record<string, unknown>,
) {
  return useQuery({
    queryKey: ['public-seedlings', nurseryId, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v != null && v !== '') params.set(k, String(v));
      });
      const { data } = await api.get<ApiOk<PaginatedResponse<MobileSeedling>>>(
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
      const { data } = await api.get<ApiOk<MobileSeedling>>(
        `/api/nurseries/${nurseryId}/seedlings/${seedlingId}`,
      );
      return data.data;
    },
    enabled: !!nurseryId && !!seedlingId,
  });
}

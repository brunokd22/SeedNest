import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

type Category = {
  id: string;
  name: string;
  description: string | null;
  nurseryId: string;
};

type ApiOk<T> = { success: boolean; data: T };

export function useCategoriesByNursery(nurseryId: string) {
  return useQuery({
    queryKey: ['categories', nurseryId],
    queryFn: async () => {
      const { data } = await api.get<ApiOk<Category[]>>(
        `/api/nurseries/${nurseryId}/categories`,
      );
      return data.data;
    },
    enabled: !!nurseryId,
  });
}

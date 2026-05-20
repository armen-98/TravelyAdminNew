'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Facility } from '@/types';

export function useFacilities() {
  return useQuery({
    queryKey: ['facilities'],
    queryFn: async () => {
      const { data } = await api.get<{ data: Facility[] }>('/facilities', {
        params: { limit: 200 },
      });
      return data.data ?? [];
    },
  });
}

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { PaginatedResponse, Place } from '@/types';
import { toast } from 'sonner';

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const resp = (error as { response?: { data?: { message?: string | string[] } } }).response;
    const msg = resp?.data?.message;
    if (msg) return Array.isArray(msg) ? msg.join(', ') : msg;
  }
  return fallback;
}

interface PlacesParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: number;
  isActive?: boolean;
  isVerified?: boolean;
  verificationFilter?: 'pending' | 'approved' | 'rejected';
  enabled?: boolean;
}

export function usePlaces(params: PlacesParams = {}) {
  const { enabled = true, ...queryParams } = params;
  return useQuery({
    queryKey: ['places', queryParams],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Place>>('/admin/places', {
        params: { page: 1, limit: 20, ...queryParams },
      });
      return data;
    },
    enabled,
  });
}

export function usePlace(id: number) {
  return useQuery({
    queryKey: ['places', id],
    queryFn: async () => {
      const { data } = await api.get<{ data: Place }>(`/admin/places/${id}`);
      return data.data ?? data;
    },
    enabled: !!id,
  });
}

export function useApprovePlace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.patch(`/admin/places/${id}/approve`);
      return data;
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['places'] });
      queryClient.invalidateQueries({ queryKey: ['places', id] });
      toast.success('Place approved successfully');
    },
    onError: () => toast.error('Failed to approve place'),
  });
}

export function useRejectPlace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      const { data } = await api.patch(`/admin/places/${id}/reject`, { reason });
      return data;
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['places'] });
      queryClient.invalidateQueries({ queryKey: ['places', id] });
      toast.success('Place rejected');
    },
    onError: () => toast.error('Failed to reject place'),
  });
}

export function useCreatePlace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data } = await api.post<{ data: Place }>('/places', payload);
      return data.data ?? (data as unknown as Place);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['places'] });
      toast.success('Place created successfully');
    },
    onError: (error: unknown) => toast.error(getApiErrorMessage(error, 'Failed to create place')),
  });
}

export function useDeletePlace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.delete(`/admin/places/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['places'] });
      toast.success('Place deleted');
    },
    onError: () => toast.error('Failed to delete place'),
  });
}

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { Place, PaginatedResponse } from "@/types";
import { toast } from "sonner";

interface PlacesParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: number;
  isActive?: boolean;
  isVerified?: boolean;
}

export function usePlaces(params: PlacesParams = {}) {
  return useQuery({
    queryKey: ["places", params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Place>>("/admin/places", {
        params: { page: 1, limit: 20, ...params },
      });
      return data;
    },
  });
}

export function usePlace(id: number) {
  return useQuery({
    queryKey: ["places", id],
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["places"] });
      toast.success("Place approved successfully");
    },
    onError: () => toast.error("Failed to approve place"),
  });
}

export function useRejectPlace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      const { data } = await api.patch(`/admin/places/${id}/reject`, { reason });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["places"] });
      toast.success("Place rejected");
    },
    onError: () => toast.error("Failed to reject place"),
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
      queryClient.invalidateQueries({ queryKey: ["places"] });
      toast.success("Place deleted");
    },
    onError: () => toast.error("Failed to delete place"),
  });
}

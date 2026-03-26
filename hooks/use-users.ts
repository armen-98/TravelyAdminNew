"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { User, PaginatedResponse } from "@/types";
import { toast } from "sonner";

interface UsersParams {
  page?: number;
  limit?: number;
  search?: string;
}

export function useUsers(params: UsersParams = {}) {
  return useQuery({
    queryKey: ["users", params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<User>>("/admin/users", {
        params: { page: 1, limit: 20, ...params },
      });
      return data;
    },
  });
}

export function useUser(id: number) {
  return useQuery({
    queryKey: ["users", id],
    queryFn: async () => {
      const { data } = await api.get<{ data: User }>(`/admin/users/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useActivateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.patch(`/admin/users/${id}/activate`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User activated successfully");
    },
    onError: () => toast.error("Failed to activate user"),
  });
}

export function useDeactivateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.patch(`/admin/users/${id}/deactivate`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User deactivated successfully");
    },
    onError: () => toast.error("Failed to deactivate user"),
  });
}

export function useAssignUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, roleName }: { id: number; roleName: string }) => {
      const { data } = await api.patch(`/admin/users/${id}/role`, { roleName });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User role updated successfully");
    },
    onError: () => toast.error("Failed to update user role"),
  });
}

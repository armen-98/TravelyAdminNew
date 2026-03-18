"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { Category, PaginatedResponse } from "@/types";
import { toast } from "sonner";

export function useCategories(params: { page?: number; limit?: number; search?: string; onlyParents?: boolean } = {}) {
  return useQuery({
    queryKey: ["categories", params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Category>>("/category", {
        params: { page: 1, limit: 100, onlyParents: true, ...params },
      });
      return data;
    },
  });
}

export function useCategory(id: number) {
  return useQuery({
    queryKey: ["categories", id],
    queryFn: async () => {
      const { data } = await api.get<{ data: Category }>(`/category/${id}`);
      return data.data ?? data;
    },
    enabled: !!id,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Category>) => {
      const { data } = await api.post("/category", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category created");
    },
    onError: () => toast.error("Failed to create category"),
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<Category> & { id: number }) => {
      const { data } = await api.patch(`/category/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category updated");
    },
    onError: () => toast.error("Failed to update category"),
  });
}

export function useToggleCategoryActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.patch(`/category/${id}/toggle-active`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category status updated");
    },
    onError: () => toast.error("Failed to update category status"),
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.delete(`/category/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category deleted");
    },
    onError: () => toast.error("Failed to delete category"),
  });
}

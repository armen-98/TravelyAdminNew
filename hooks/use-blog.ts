"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { Blog, PaginatedResponse } from "@/types";
import { toast } from "sonner";

export function useBlogs(params: { page?: number; limit?: number; search?: string } = {}) {
  return useQuery({
    queryKey: ["blog", params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Blog>>("/admin/blogs", {
        params: { page: 1, limit: 20, ...params },
      });
      return data;
    },
  });
}

export function useBlog(id: number) {
  return useQuery({
    queryKey: ["blog", id],
    queryFn: async () => {
      const { data } = await api.get<{ data: Blog }>(`/admin/blogs/${id}`);
      return data.data ?? data;
    },
    enabled: !!id,
  });
}

export function useCreateBlog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Blog>) => {
      // Creation still goes through the regular blog endpoint (handles file attachments)
      const { data } = await api.post("/blog", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog"] });
      toast.success("Blog post created");
    },
    onError: () => toast.error("Failed to create blog post"),
  });
}

export function useUpdateBlog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<Blog> & { id: number }) => {
      const { data } = await api.patch(`/admin/blogs/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog"] });
      toast.success("Blog post updated");
    },
    onError: () => toast.error("Failed to update blog post"),
  });
}

export function useDeleteBlog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.delete(`/admin/blogs/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog"] });
      toast.success("Blog post deleted");
    },
    onError: () => toast.error("Failed to delete blog post"),
  });
}

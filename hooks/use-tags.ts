"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { Tag } from "@/types";
import { toast } from "sonner";

export function useTags() {
  return useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      const { data } = await api.get<{ data: Tag[] } | Tag[]>("/tags");
      return Array.isArray(data) ? data : (data as { data: Tag[] }).data;
    },
  });
}

export function useCreateTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const { data } = await api.post("/tags", { name });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      toast.success("Tag created");
    },
    onError: () => toast.error("Failed to create tag"),
  });
}

export function useDeleteTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.delete(`/tags/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      toast.success("Tag deleted");
    },
    onError: () => toast.error("Failed to delete tag"),
  });
}

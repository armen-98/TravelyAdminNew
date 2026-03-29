"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { AdminLocationNode } from "@/types";
import { toast } from "sonner";

const treeKey = ["admin-locations-tree"] as const;

export function useAdminLocationTree() {
  return useQuery({
    queryKey: treeKey,
    queryFn: async () => {
      const { data } = await api.get<{ data: AdminLocationNode[] }>(
        "/admin/locations"
      );
      return data.data ?? [];
    },
  });
}

export function useCreateAdminLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      name: string;
      type: "country" | "state" | "city";
      parentId?: number;
      imageId?: number | null;
    }) => {
      const { data } = await api.post<{ data: AdminLocationNode }>(
        "/admin/locations",
        body
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: treeKey });
      toast.success("Location created");
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      const msg =
        err.response?.data?.message ||
        (typeof err.response?.data === "string"
          ? err.response.data
          : null);
      toast.error(msg || "Failed to create location");
    },
  });
}

export function useUpdateAdminLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: number;
      body: {
        name?: string;
        parentId?: number;
        imageId?: number | null;
      };
    }) => {
      const { data } = await api.patch<{ data: AdminLocationNode }>(
        `/admin/locations/${id}`,
        body
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: treeKey });
      toast.success("Location updated");
    },
    onError: (err: { response?: { data?: { message?: string | string[] } } }) => {
      const d = err.response?.data;
      const msg =
        (typeof d?.message === "string" ? d.message : null) ||
        (Array.isArray(d?.message) ? d.message.join(", ") : null);
      toast.error(msg || "Failed to update location");
    },
  });
}

export function useDeleteAdminLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/admin/locations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: treeKey });
      toast.success("Location deleted");
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      const msg =
        err.response?.data?.message ||
        (typeof err.response?.data === "string"
          ? err.response.data
          : null);
      toast.error(msg || "Failed to delete location");
    },
  });
}

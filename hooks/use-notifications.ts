"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { Notification, PaginatedResponse } from "@/types";
import { toast } from "sonner";

export function useNotifications(params: { page?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: ["notifications", params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Notification>>("/notifications", {
        params: { page: 1, limit: 20, ...params },
      });
      return data;
    },
  });
}

export function useSendNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { title: string; body: string }) => {
      const { data } = await api.post("/notifications/broadcast", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Notification sent successfully");
    },
    onError: () => toast.error("Failed to send notification"),
  });
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { ContactRequest, PaginatedResponse } from "@/types";
import { toast } from "sonner";

interface ContactRequestsParams {
  page?: number;
  limit?: number;
  search?: string;
  userId?: number;
}

export function useContactRequests(params: ContactRequestsParams = {}) {
  return useQuery({
    queryKey: ["contact-requests", params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<ContactRequest>>(
        "/admin/contact-requests",
        { params: { page: 1, limit: 20, ...params } },
      );
      return data;
    },
  });
}

export function useResolveContactRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.patch(`/admin/contact-requests/${id}/resolve`);
      return data;
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["contact-requests"] });
      queryClient.invalidateQueries({ queryKey: ["contact-request", id] });
      toast.success("Contact request resolved");
    },
    onError: () => toast.error("Failed to resolve contact request"),
  });
}


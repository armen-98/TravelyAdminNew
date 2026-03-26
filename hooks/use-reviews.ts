"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { PlaceReview, PaginatedResponse } from "@/types";
import { toast } from "sonner";

interface ReviewsParams {
  page?: number;
  limit?: number;
  search?: string;
  placeId?: number;
  reviewStatus?: "pending" | "approved" | "rejected";
}

export function useReviews(params: ReviewsParams = {}) {
  return useQuery({
    queryKey: ["reviews", params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<PlaceReview>>(
        "/admin/reviews",
        { params: { page: 1, limit: 20, ...params } }
      );
      return data;
    },
  });
}

export function useApproveReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.patch(`/admin/reviews/${id}/approve`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      toast.success("Review approved");
    },
    onError: () => toast.error("Failed to approve review"),
  });
}

export function useRejectReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.patch(`/admin/reviews/${id}/reject`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      toast.success("Review rejected");
    },
    onError: () => toast.error("Failed to reject review"),
  });
}

export function useDeleteReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.delete(`/admin/reviews/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      toast.success("Review deleted");
    },
    onError: () => toast.error("Failed to delete review"),
  });
}

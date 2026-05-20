import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { PlaceClaim } from "@/types/claim";

type ClaimsListResponse = {
  data: PlaceClaim[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export function useClaims(params: {
  page?: number;
  limit?: number;
  status?: string;
  placeId?: number;
}) {
  return useQuery({
    queryKey: ["admin", "claims", params],
    queryFn: async () => {
      const { data } = await api.get<ClaimsListResponse>("/admin/claims", {
        params,
      });
      return data;
    },
  });
}

export function useClaim(id: number | null) {
  return useQuery({
    queryKey: ["admin", "claims", id],
    enabled: id != null && id > 0,
    queryFn: async () => {
      const { data } = await api.get<{ data: PlaceClaim }>(`/admin/claims/${id}`);
      return data.data;
    },
  });
}

export function useApproveClaim() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      adminNotes,
    }: {
      id: number;
      adminNotes?: string;
    }) => {
      const { data } = await api.patch(`/admin/claims/${id}/approve`, {
        adminNotes,
      });
      return data;
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["admin", "claims"] });
      qc.invalidateQueries({ queryKey: ["admin", "claims", id] });
    },
  });
}

export function useRejectClaim() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      rejectionReason,
      adminNotes,
    }: {
      id: number;
      rejectionReason?: string;
      adminNotes?: string;
    }) => {
      const { data } = await api.patch(`/admin/claims/${id}/reject`, {
        rejectionReason,
        adminNotes,
      });
      return data;
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["admin", "claims"] });
      qc.invalidateQueries({ queryKey: ["admin", "claims", id] });
    },
  });
}

export function useClaimCostSetting() {
  return useQuery({
    queryKey: ["claim", "settings", "cost"],
    queryFn: async () => {
      const { data } = await api.get<{ data: { claimCost: number | null } }>(
        "/claim/settings/cost",
      );
      return data.data?.claimCost ?? null;
    },
  });
}

export function useUpdateClaimCostSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (claimCost: number | null) => {
      const { data } = await api.post("/claim/settings/cost", { claimCost });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["claim", "settings", "cost"] });
    },
  });
}

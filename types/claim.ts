export type PlaceClaimStatus = "pending" | "approved" | "rejected";

export type PlaceClaim = {
  id: number;
  placeId: number;
  userId: number;
  status: PlaceClaimStatus;
  fullName: string;
  email: string;
  phone?: string | null;
  businessName?: string | null;
  relationship?: string | null;
  message?: string | null;
  documentFileIds?: number[] | null;
  adminNotes?: string | null;
  rejectionReason?: string | null;
  reviewedById?: number | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  place?: { id: number; name: string };
  user?: {
    id: number;
    fullName?: string;
    email?: string;
    role?: { name: string };
  };
};

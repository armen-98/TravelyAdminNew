"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { DataTable, Column } from "@/components/tables/data-table";
import {
  usePlaces,
  useApprovePlace,
  useRejectPlace,
  useDeletePlace,
} from "@/hooks/use-places";
import type { Place } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Trash2,
  Eye,
  MapPin,
  Star,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function PlacesPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [rejectTarget, setRejectTarget] = useState<Place | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data, isLoading } = usePlaces({ page });
  const approve = useApprovePlace();
  const reject = useRejectPlace();
  const deletePlace = useDeletePlace();

  const handleReject = () => {
    if (!rejectTarget || !rejectReason.trim()) return;
    reject.mutate({ id: rejectTarget.id, reason: rejectReason });
    setRejectTarget(null);
    setRejectReason("");
  };

  const columns: Column<Place>[] = [
    {
      key: "name",
      header: "Place",
      cell: (place) => {
        const img = place.images?.[0]?.url;
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0 relative">
              {img ? (
                <Image
                  src={img}
                  alt={place.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>
            <div>
              <p className="font-medium text-sm">{place.name}</p>
              <p className="text-xs text-muted-foreground truncate max-w-[160px]">
                {place.address ?? place.city?.name ?? "—"}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      key: "category",
      header: "Category",
      cell: (place) => (
        <span className="text-sm">{place.category?.name ?? "—"}</span>
      ),
    },
    {
      key: "user",
      header: "Author",
      cell: (place) =>
        place.user ? (
          <button
            onClick={() => router.push(`/users/${place.user!.id}`)}
            className="text-sm text-blue-600 hover:underline text-left"
          >
            {place.user.fullName}
          </button>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        ),
    },
    {
      key: "averageRating",
      header: "Rating",
      cell: (place) => (
        <div className="flex items-center gap-1">
          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
          <span className="text-sm">
            {place.averageRating != null ? Number(place.averageRating).toFixed(1) : "—"}
          </span>
        </div>
      ),
    },
    {
      key: "isVerified",
      header: "Status",
      cell: (place) => {
        if (place.isVerified === true)  return <Badge variant="success">Approved</Badge>;
        if (place.isVerified === false) return <Badge variant="destructive">Rejected</Badge>;
        return <Badge variant="warning">Pending</Badge>;
      },
    },
    {
      key: "createdAt",
      header: "Created",
      cell: (place) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(place.createdAt)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      cell: (place) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/places/${place.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </Link>
            </DropdownMenuItem>
            {place.isVerified !== true && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-green-600 focus:text-green-600"
                  onClick={() => approve.mutate(place.id)}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-orange-600 focus:text-orange-600"
                  onClick={() => setRejectTarget(place)}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600"
              onClick={() => deletePlace.mutate(place.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-green-100">
          <MapPin className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Places</h1>
          <p className="text-muted-foreground text-sm">
            Manage and moderate place listings
            {data?.total ? ` · ${data.total} total` : ""}
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={(data?.data ?? []) as Place[]}
        isLoading={isLoading}
        searchKey="name"
        searchPlaceholder="Search places..."
        page={page}
        totalPages={data?.totalPages}
        onPageChange={setPage}
      />

      {/* Reject Dialog */}
      <Dialog open={!!rejectTarget} onOpenChange={() => setRejectTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Place</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting &quot;{rejectTarget?.name}&quot;. This will be
              shared with the place owner.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="reason">Rejection Reason</Label>
            <Textarea
              id="reason"
              placeholder="Describe why this place is being rejected..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectReason.trim() || reject.isPending}
            >
              Reject Place
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

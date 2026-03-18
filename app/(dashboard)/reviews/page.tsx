"use client";

import { useState } from "react";
import Link from "next/link";
import { DataTable, Column } from "@/components/tables/data-table";
import {
  useReviews,
  useApproveReview,
  useRejectReview,
  useDeleteReview,
} from "@/hooks/use-reviews";
import type { PlaceReview } from "@/types";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  MoreHorizontal,
  Star,
  CheckCircle,
  XCircle,
  Trash2,
  ExternalLink,
  MessageSquare,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function ReviewsPage() {
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<PlaceReview | null>(null);

  const { data, isLoading } = useReviews({ page });
  const approve = useApproveReview();
  const reject = useRejectReview();
  const deleteReview = useDeleteReview();

  const columns: Column<PlaceReview>[] = [
    {
      key: "place",
      header: "Place",
      cell: (review) => (
        <div className="flex items-center gap-2">
          <Link
            href={`/places/${review.place?.id}`}
            className="font-medium text-sm text-blue-600 hover:underline flex items-center gap-1"
          >
            {review.place?.name ?? `#${review.placeId}`}
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      ),
    },
    {
      key: "user",
      header: "Author",
      cell: (review) => (
        <span className="text-sm text-muted-foreground">
          {review.user?.fullName ?? "Unknown"}
        </span>
      ),
    },
    {
      key: "rating",
      header: "Rating",
      cell: (review) => (
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-3 w-3 ${
                i < Number(review.rating)
                  ? "text-yellow-500 fill-yellow-500"
                  : "text-muted-foreground/30"
              }`}
            />
          ))}
          <span className="text-xs text-muted-foreground ml-1">
            {Number(review.rating).toFixed(1)}
          </span>
        </div>
      ),
    },
    {
      key: "comment",
      header: "Comment",
      cell: (review) => (
        <p className="text-sm text-muted-foreground max-w-xs truncate">
          {review.comment ?? <span className="italic">No comment</span>}
        </p>
      ),
    },
    {
      key: "isActive",
      header: "Status",
      cell: (review) => {
        if (review.isActive === true)  return <Badge variant="success">Approved</Badge>;
        if (review.isActive === false) return <Badge variant="destructive">Rejected</Badge>;
        return <Badge variant="warning">Pending</Badge>;
      },
    },
    {
      key: "createdAt",
      header: "Date",
      cell: (review) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(review.createdAt)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      cell: (review) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/places/${review.place?.id}`}>
                <ExternalLink className="mr-2 h-4 w-4" />
                View Place
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {review.isActive !== true ? (
              <DropdownMenuItem
                className="text-green-600 focus:text-green-600"
                onClick={() => approve.mutate(review.id)}
                disabled={approve.isPending}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve
              </DropdownMenuItem>
            ) : null}
            {review.isActive !== false ? (
              <DropdownMenuItem
                className="text-orange-600 focus:text-orange-600"
                onClick={() => reject.mutate(review.id)}
                disabled={reject.isPending}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600"
              onClick={() => setDeleteTarget(review)}
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
        <div className="p-2 rounded-lg bg-yellow-100">
          <MessageSquare className="h-5 w-5 text-yellow-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Reviews</h1>
          <p className="text-muted-foreground text-sm">
            Moderate place reviews
            {data?.total ? ` · ${data.total} total` : ""}
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={(data?.data ?? []) as PlaceReview[]}
        isLoading={isLoading}
        searchKey="comment"
        searchPlaceholder="Search reviews..."
        page={page}
        totalPages={data?.totalPages}
        onPageChange={setPage}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Review</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete this review by{" "}
              <strong>{deleteTarget?.user?.fullName}</strong>? This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (deleteTarget) deleteReview.mutate(deleteTarget.id);
                setDeleteTarget(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

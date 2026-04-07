"use client";

import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { usePlace, useApprovePlace, useRejectPlace } from "@/hooks/use-places";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Globe,
  Star,
  Eye,
  Heart,
  CheckCircle,
  XCircle,
  Calendar,
  History,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useMemo, useState } from "react";
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
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import type { PlaceModerationHistoryItem, PlaceReview } from "@/types";

function moderationEventTitle(type: string): string {
  switch (type) {
    case "submitted":
      return "Submitted for review";
    case "resubmitted":
      return "Re-submitted by owner";
    case "rejected":
      return "Rejected";
    case "approved":
      return "Approved";
    case "verification_revoked":
      return "Verification revoked";
    default:
      return type;
  }
}

export default function PlaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const { data: place, isLoading } = usePlace(Number(id));
  const approve = useApprovePlace();
  const reject = useRejectPlace();

  const moderationEntriesNewestFirst = useMemo(
    () =>
      place?.moderationHistory?.length
        ? [...place.moderationHistory].reverse()
        : [],
    [place?.moderationHistory],
  );

  const { data: reviews, isLoading: reviewsLoading } = useQuery({
    queryKey: ["place-reviews", id],
    queryFn: async () => {
      const { data } = await api.get<{ data: PlaceReview[] }>(
        `/places/${id}/reviews`
      );
      return data.data ?? data;
    },
    enabled: !!id,
  });

  const handleReject = () => {
    if (!rejectReason.trim()) return;
    reject.mutate({ id: Number(id), reason: rejectReason });
    setRejectOpen(false);
    setRejectReason("");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  if (!place) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Place not found.</p>
        <Button variant="link" onClick={() => router.back()}>
          Go back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{place.name}</h1>
            <p className="text-muted-foreground text-sm">{place.slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {place.isVerified === true ? (
            <Badge variant="success">Approved</Badge>
          ) : place.isVerified === false ? (
            <>
              <Badge variant="destructive">Rejected</Badge>
              <Button
                size="sm"
                onClick={() => approve.mutate(place.id)}
                disabled={approve.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Re-approve
              </Button>
            </>
          ) : (
            <>
              <Badge variant="warning">Pending</Badge>
              <Button
                size="sm"
                onClick={() => approve.mutate(place.id)}
                disabled={approve.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setRejectOpen(true)}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </Button>
            </>
          )}
        </div>
      </div>

      {place.isVerified === false && place.rejectionReason ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
          <p className="font-medium text-destructive">Rejection reason</p>
          <p className="text-muted-foreground mt-1 whitespace-pre-wrap">
            {place.rejectionReason}
          </p>
        </div>
      ) : null}

      {/* Images */}
      {place.images && place.images.length > 0 && (
        <div className="grid grid-cols-3 gap-2 rounded-xl overflow-hidden max-h-72">
          <div className="col-span-2 row-span-2 relative">
            <Image
              src={place.images[0].url}
              alt={place.name}
              fill
              className="object-cover"
            />
          </div>
          {place.images.slice(1, 3).map((img: import("@/types").FileEntity) => (
            <div key={img.id} className="relative aspect-square">
              <Image
                src={img.url}
                alt={place.name}
                fill
                className="object-cover"
              />
            </div>
          ))}
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
            <div>
              <p className="text-xs text-muted-foreground">Rating</p>
              <p className="font-semibold">
                {place.averageRating != null ? Number(place.averageRating).toFixed(1) : "—"} ({place.reviewCount} reviews)
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Eye className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-xs text-muted-foreground">Views</p>
              <p className="font-semibold">{place.viewCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Heart className="h-5 w-5 text-red-500" />
            <div>
              <p className="text-xs text-muted-foreground">Favorites</p>
              <p className="font-semibold">{place.favoriteCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Calendar className="h-5 w-5 text-purple-500" />
            <div>
              <p className="text-xs text-muted-foreground">Created</p>
              <p className="font-semibold">{formatDate(place.createdAt)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs: Reviews first, Moderation, Info last (reversed from previous Info-then-Reviews) */}
      <Tabs defaultValue="reviews">
        <TabsList>
          <TabsTrigger value="reviews">
            Reviews ({place.reviewCount ?? 0})
          </TabsTrigger>
          <TabsTrigger value="moderation">Moderation</TabsTrigger>
          <TabsTrigger value="info">Info</TabsTrigger>
        </TabsList>

        <TabsContent value="reviews" className="mt-4">
          <div className="space-y-3">
            {reviewsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))
            ) : reviews && reviews.length > 0 ? (
              reviews.map((review: PlaceReview) => (
                <Card key={review.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm">
                            {review.user?.fullName ?? "Anonymous"}
                          </p>
                          <div className="flex">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${
                                  i < review.rating
                                    ? "text-yellow-500 fill-yellow-500"
                                    : "text-muted-foreground"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-muted-foreground">
                            {review.comment}
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground flex-shrink-0">
                        {formatDate(review.createdAt)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  No reviews yet.
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="moderation" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <History className="h-4 w-4" />
                Moderation history
              </CardTitle>
            </CardHeader>
            <CardContent>
              {moderationEntriesNewestFirst.length > 0 ? (
                <ul className="space-y-4 border-l-2 border-muted ml-1.5 pl-5">
                  {moderationEntriesNewestFirst.map((entry: PlaceModerationHistoryItem) => (
                    <li key={entry.id} className="text-sm relative">
                      <span className="absolute -left-[1.15rem] top-1.5 h-2 w-2 rounded-full bg-muted-foreground/40" />
                      <p className="font-medium">{moderationEventTitle(entry.eventType)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDate(entry.createdAt)}
                        {entry.actor?.fullName || entry.actor?.email
                          ? ` · ${entry.actor?.fullName ?? entry.actor?.email ?? ""}`
                          : null}
                      </p>
                      {entry.eventType === "rejected" && entry.reason ? (
                        <p className="text-muted-foreground mt-2 whitespace-pre-wrap rounded-md bg-muted/50 px-3 py-2 text-xs">
                          {entry.reason}
                        </p>
                      ) : null}
                      {entry.eventType === "resubmitted" && entry.reason ? (
                        <div className="mt-2 rounded-md border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs">
                          <p className="font-medium text-amber-900 dark:text-amber-200">
                            Admin feedback at time of re-submit
                          </p>
                          <p className="text-muted-foreground mt-1 whitespace-pre-wrap">
                            {entry.reason}
                          </p>
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No recorded events yet. Submissions and review actions are logged from when this feature is deployed; run the latest migration and new activity will appear here.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="info" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {place.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <span>{place.address}</span>
                  </div>
                )}
                {place.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span>{place.phone}</span>
                  </div>
                )}
                {place.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span>{place.email}</span>
                  </div>
                )}
                {place.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <a
                      href={place.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline truncate"
                    >
                      {place.website}
                    </a>
                  </div>
                )}
              </div>

              {place.description && (
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-1">
                    Description
                  </p>
                  <p className="text-sm leading-relaxed">{place.description}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">Category</p>
                  <Badge variant="outline">{place.category?.name ?? "—"}</Badge>
                </div>
                {place.subcategory && (
                  <div>
                    <p className="text-xs text-muted-foreground">Subcategory</p>
                    <Badge variant="outline">{place.subcategory.name}</Badge>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground">Owner</p>
                  <Badge variant="secondary">
                    {place.user?.fullName ?? "—"}
                  </Badge>
                </div>
              </div>

              {place.tags && place.tags.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-2">
                    Tags
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {place.tags.map((tag: import("@/types").Tag) => (
                      <Badge key={tag.id} variant="outline" className="text-xs">
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Place</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting &quot;{place.name}&quot;.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Rejection Reason</Label>
            <Textarea
              placeholder="Describe why this place is being rejected..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
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

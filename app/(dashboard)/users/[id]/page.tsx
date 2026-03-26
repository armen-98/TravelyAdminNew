"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import api from "@/lib/api";
import type { User, Place, PlaceReview, PaginatedResponse } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  UserCheck,
  UserX,
  MapPin,
  Star,
  ExternalLink,
  Mail,
  Phone,
  Globe,
  Calendar,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";
import { formatDate, getRoleBadgeVariant } from "@/lib/utils";
import { toast } from "sonner";
import { canManageUsers } from "@/lib/permissions";
import { useAssignUserRole } from "@/hooks/use-users";

function initials(name?: string) {
  return (name ?? "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const sessionRole = session?.user?.role;
  const assignRole = useAssignUserRole();
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [pendingRole, setPendingRole] = useState<string | null>(null);

  // ── User ──────────────────────────────────────────────────────────────────
  const { data: user, isLoading } = useQuery({
    queryKey: ["users", id],
    queryFn: async () => {
      const { data } = await api.get<{ data: User }>(`/admin/users/${id}`);
      return data.data ?? data;
    },
  });

  // ── User's places ─────────────────────────────────────────────────────────
  const { data: placesData, isLoading: placesLoading } = useQuery({
    queryKey: ["places", { userId: id }],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Place>>("/admin/places", {
        params: { userId: id, limit: 50 },
      });
      return data;
    },
    enabled: !!id,
  });

  // ── User's reviews ────────────────────────────────────────────────────────
  const { data: reviewsData, isLoading: reviewsLoading } = useQuery({
    queryKey: ["reviews", { userId: id }],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<PlaceReview>>(
        "/admin/reviews",
        { params: { userId: id, limit: 50 } }
      );
      return data;
    },
    enabled: !!id,
  });

  // ── Activate / Deactivate ─────────────────────────────────────────────────
  const activate = useMutation({
    mutationFn: () => api.patch(`/admin/users/${id}/activate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User activated");
    },
  });

  const deactivate = useMutation({
    mutationFn: () => api.patch(`/admin/users/${id}/deactivate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User deactivated");
    },
  });

  const places  = placesData?.data  ?? [];
  const reviews = reviewsData?.data ?? [];

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">User not found.</p>
        <Button variant="link" onClick={() => router.back()}>Go back</Button>
      </div>
    );
  }

  const role = user.role?.name ?? "user";

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back + actions */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Users
        </Button>
        {canManageUsers(sessionRole) && (
          <div className="flex items-center gap-2 flex-wrap">
            {/* Assign Role */}
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              <Select
                value={user.role?.name ?? "user"}
                onValueChange={(roleName) => {
                  if (roleName === "super-admin" || roleName === "admin") {
                    setPendingRole(roleName);
                  } else {
                    assignRole.mutate({ id: Number(id), roleName });
                  }
                }}
                disabled={assignRole.isPending}
              >
                <SelectTrigger className="h-8 w-36 text-sm">
                  <SelectValue placeholder="Assign role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super-admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Activate / Deactivate */}
            {user.isActive ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeactivateConfirm(true)}
                disabled={deactivate.isPending}
              >
                <UserX className="mr-2 h-4 w-4" />
                Deactivate
              </Button>
            ) : (
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700"
                onClick={() => activate.mutate()}
                disabled={activate.isPending}
              >
                <UserCheck className="mr-2 h-4 w-4" />
                Activate
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Profile card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-5 flex-wrap">
            <Avatar className="h-20 w-20 flex-shrink-0">
              <AvatarImage src={user.profileImage?.url} />
              <AvatarFallback className="bg-blue-600 text-white text-2xl font-bold">
                {initials(user.fullName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold">{user.fullName}</h1>
                <Badge variant={getRoleBadgeVariant(role)} className="capitalize">
                  {role}
                </Badge>
                <Badge variant={user.isActive ? "success" : "destructive"}>
                  {user.isActive ? "Active" : "Inactive"}
                </Badge>
                {user.isPro && <Badge>Pro</Badge>}
              </div>

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{user.email}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 flex-shrink-0" />
                    <span>{user.phone}</span>
                  </div>
                )}
                {user.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 flex-shrink-0" />
                    <a href={user.website} target="_blank" rel="noopener noreferrer"
                      className="text-blue-600 hover:underline truncate">
                      {user.website}
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                  <span>Joined {formatDate(user.createdAt)}</span>
                </div>
              </div>

              {user.description && (
                <>
                  <Separator className="my-3" />
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {user.description}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Quick stats */}
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="rounded-lg bg-muted/50 px-4 py-3 text-center">
              <p className="text-2xl font-bold">{placesData?.total ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Places</p>
            </div>
            <div className="rounded-lg bg-muted/50 px-4 py-3 text-center">
              <p className="text-2xl font-bold">{reviewsData?.total ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Reviews</p>
            </div>
            <div className="rounded-lg bg-muted/50 px-4 py-3 text-center">
              <p className="text-2xl font-bold capitalize">{role}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Role</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs: Places + Reviews */}
      <Tabs defaultValue="places">
        <TabsList>
          <TabsTrigger value="places" className="gap-2">
            <MapPin className="h-4 w-4" />
            Places ({placesData?.total ?? 0})
          </TabsTrigger>
          <TabsTrigger value="reviews" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Reviews ({reviewsData?.total ?? 0})
          </TabsTrigger>
        </TabsList>

        {/* ── Places tab ── */}
        <TabsContent value="places" className="mt-4">
          {placesLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))}
            </div>
          ) : places.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                No places submitted yet.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {places.map((place) => (
                <Card key={place.id} className="hover:bg-muted/30 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          {place.images?.[0]?.url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={place.images[0].url}
                              alt={place.name}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{place.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {place.category?.name}
                            {place.city?.name ? ` · ${place.city.name}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {place.isVerified === true  && <Badge variant="success" className="text-xs">Approved</Badge>}
                        {place.isVerified === false && <Badge variant="destructive" className="text-xs">Rejected</Badge>}
                        {place.isVerified === null  && <Badge variant="warning" className="text-xs">Pending</Badge>}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          {Number(place.averageRating).toFixed(1)}
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                          <Link href={`/places/${place.id}`}>
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Reviews tab ── */}
        <TabsContent value="reviews" className="mt-4">
          {reviewsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                No reviews written yet.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {reviews.map((review) => (
                <Card key={review.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Link
                            href={`/places/${review.place?.id}`}
                            className="font-medium text-sm text-blue-600 hover:underline flex items-center gap-1"
                          >
                            {review.place?.name ?? `Place #${review.placeId}`}
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                          <div className="flex items-center gap-0.5">
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
                          </div>
                          {review.isActive === true  && <Badge variant="success" className="text-xs">Approved</Badge>}
                          {review.isActive === false && <Badge variant="destructive" className="text-xs">Rejected</Badge>}
                          {review.isActive === null  && <Badge variant="warning" className="text-xs">Pending</Badge>}
                        </div>
                        {review.comment && (
                          <p className="text-sm text-muted-foreground">{review.comment}</p>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground flex-shrink-0">
                        {formatDate(review.createdAt)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Role Escalation Confirmation */}
      <AlertDialog
        open={!!pendingRole}
        onOpenChange={(open) => {
          if (!open) setPendingRole(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Assign Privileged Role</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to assign{" "}
              <strong className="capitalize">{pendingRole}</strong> to{" "}
              <strong>{user?.fullName}</strong>. This grants elevated access to
              the admin panel. Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingRole)
                  assignRole.mutate({ id: Number(id), roleName: pendingRole });
                setPendingRole(null);
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Deactivate Confirmation */}
      <AlertDialog
        open={showDeactivateConfirm}
        onOpenChange={setShowDeactivateConfirm}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate{" "}
              <strong>{user.fullName}</strong>? They will lose access to their
              account immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                deactivate.mutate();
                setShowDeactivateConfirm(false);
              }}
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

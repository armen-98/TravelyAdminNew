"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { User } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Settings, Lock, Loader2, Trash2 } from "lucide-react";

// ── Schemas ───────────────────────────────────────────────────────────────────

const profileSchema = z.object({
  fullName: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  website: z.union([
    z.literal(""),
    z.string().url("Must be a valid URL"),
  ]),
  description: z.string().optional(),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

// ── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarRemoving, setAvatarRemoving] = useState(false);
  const [removePhotoOpen, setRemovePhotoOpen] = useState(false);

  // Fetch current user
  const { data: me, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const { data } = await api.get<{ data: User }>("/users/me");
      return data.data ?? data;
    },
  });

  // Profile form
  const {
    register: regProfile,
    handleSubmit: handleProfile,
    reset: resetProfile,
    formState: { errors: profileErrors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    if (me) {
      resetProfile({
        fullName: me.fullName ?? "",
        phone: me.phone ?? "",
        website: me.website ?? "",
        description: me.description ?? "",
      });
    }
  }, [me, resetProfile]);

  const onSaveProfile = async (values: ProfileForm) => {
    setProfileSaving(true);
    try {
      const payload = {
        fullName: values.fullName,
        description: values.description ?? "",
        phone: values.phone ?? "",
        website: values.website?.trim() ?? "",
      };
      await api.post("/users/profile", payload);
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      toast.success("Profile updated successfully");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string | string[] } } };
      const msg = err?.response?.data?.message;
      const text = Array.isArray(msg) ? msg.join(", ") : msg;
      toast.error(text || "Failed to update profile");
    } finally {
      setProfileSaving(false);
    }
  };

  const onAvatarSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setAvatarUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      await api.post("/users/profile-image", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      toast.success("Profile photo updated");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message ?? "Failed to upload photo");
    } finally {
      setAvatarUploading(false);
    }
  };

  const removeProfilePhoto = async () => {
    setAvatarRemoving(true);
    try {
      await api.delete("/users/profile-image");
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      toast.success("Profile photo removed");
      setRemovePhotoOpen(false);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message ?? "Failed to remove photo");
    } finally {
      setAvatarRemoving(false);
    }
  };

  // Password form
  const {
    register: regPassword,
    handleSubmit: handlePassword,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  const changePassword = useMutation({
    mutationFn: async (values: PasswordForm) => {
      await api.post("/users/change-password-secure", {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
    },
    onSuccess: () => {
      toast.success("Password changed successfully");
      resetPassword();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Failed to change password");
    },
  });

  const initials = me?.fullName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-lg bg-slate-100 shrink-0">
            <Settings className="h-5 w-5 text-slate-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-muted-foreground text-sm">
              Edit your profile, photo, and password
            </p>
          </div>
        </div>
        <Button variant="outline" asChild className="shrink-0">
          <Link href="/profile">Cancel</Link>
        </Button>
      </div>

      {/* Profile card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Photo */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <Avatar className="h-14 w-14">
              <AvatarImage src={me?.profileImage?.url} />
              <AvatarFallback className="bg-blue-600 text-white text-lg font-bold">
                {initials ?? "A"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp,image/avif"
                className="hidden"
                onChange={onAvatarSelected}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={avatarUploading || avatarRemoving}
                onClick={() => avatarInputRef.current?.click()}
              >
                {avatarUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading…
                  </>
                ) : (
                  "Change photo"
                )}
              </Button>
              {me?.profileImage?.url ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  disabled={avatarUploading || avatarRemoving}
                  onClick={() => setRemovePhotoOpen(true)}
                >
                  {avatarRemoving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Removing…
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove photo
                    </>
                  )}
                </Button>
              ) : null}
            </div>
          </div>

          <Separator className="mb-6" />

          <form onSubmit={handleProfile(onSaveProfile)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input id="fullName" {...regProfile("fullName")} />
                {profileErrors.fullName && (
                  <p className="text-red-500 text-xs">
                    {profileErrors.fullName.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" {...regProfile("phone")} placeholder="+1 555 000 0000" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                {...regProfile("website")}
                placeholder="https://example.com"
              />
              {profileErrors.website && (
                <p className="text-red-500 text-xs">
                  {profileErrors.website.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Bio</Label>
              <Textarea
                id="description"
                {...regProfile("description")}
                placeholder="Tell something about yourself..."
                rows={3}
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={profileSaving}>
                {profileSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Profile"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Change password card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Change Password</CardTitle>
          </div>
          <CardDescription>
            Choose a strong password with at least 8 characters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handlePassword((v) => changePassword.mutate(v))}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                {...regPassword("currentPassword")}
                autoComplete="current-password"
              />
              {passwordErrors.currentPassword && (
                <p className="text-red-500 text-xs">
                  {passwordErrors.currentPassword.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  {...regPassword("newPassword")}
                  autoComplete="new-password"
                />
                {passwordErrors.newPassword && (
                  <p className="text-red-500 text-xs">
                    {passwordErrors.newPassword.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...regPassword("confirmPassword")}
                  autoComplete="new-password"
                />
                {passwordErrors.confirmPassword && (
                  <p className="text-red-500 text-xs">
                    {passwordErrors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={changePassword.isPending}>
                {changePassword.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Changing...
                  </>
                ) : (
                  "Change Password"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <AlertDialog open={removePhotoOpen} onOpenChange={setRemovePhotoOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove profile photo?</AlertDialogTitle>
            <AlertDialogDescription>
              Your profile picture will be removed and your initials will be
              shown instead. This cannot be undone, but you can upload a new
              photo anytime.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={avatarRemoving}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={avatarRemoving}
              onClick={() => void removeProfilePhoto()}
            >
              {avatarRemoving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removing…
                </>
              ) : (
                "Remove"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useQuery, useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import type { User } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Settings, Lock, User as UserIcon, Loader2 } from "lucide-react";

// ── Schemas ───────────────────────────────────────────────────────────────────

const profileSchema = z.object({
  fullName: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  description: z.string().optional(),
});

const passwordSchema = z
  .object({
    oldPassword: z.string().min(1, "Current password is required"),
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
  const { data: session } = useSession();
  const [profileSaving, setProfileSaving] = useState(false);

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
      await api.post("/users/profile", values);
      toast.success("Profile updated successfully");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setProfileSaving(false);
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
      await api.post("/users/change-password", {
        oldPassword: values.oldPassword,
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
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-slate-100">
          <Settings className="h-5 w-5 text-slate-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground text-sm">
            Manage your account information
          </p>
        </div>
      </div>

      {/* Profile card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <UserIcon className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Profile Information</CardTitle>
          </div>
          <CardDescription>Update your name, contact, and bio</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Avatar row */}
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="h-16 w-16">
              <AvatarImage src={me?.profileImage?.url} />
              <AvatarFallback className="bg-blue-600 text-white text-xl font-bold">
                {initials ?? "A"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{me?.fullName}</p>
              <p className="text-sm text-muted-foreground">{me?.email}</p>
              <p className="text-xs text-blue-600 capitalize mt-0.5">
                {(me as any)?.role?.name ?? session?.user?.role}
              </p>
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
              <Label htmlFor="oldPassword">Current Password</Label>
              <Input
                id="oldPassword"
                type="password"
                {...regPassword("oldPassword")}
                autoComplete="current-password"
              />
              {passwordErrors.oldPassword && (
                <p className="text-red-500 text-xs">
                  {passwordErrors.oldPassword.message}
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
    </div>
  );
}

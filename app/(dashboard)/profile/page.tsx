"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { User as UserIcon, ExternalLink, Pencil } from "lucide-react";
import api from "@/lib/api";
import type { User } from "@/types";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function initialsFromName(fullName: string | null | undefined) {
  if (!fullName?.trim()) return "?";
  return fullName
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function ProfilePage() {
  const { data: session } = useSession();

  const { data: me, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const { data } = await api.get<{ data: User }>("/users/me");
      return data.data ?? data;
    },
  });

  const roleLabel =
    (me as { role?: { name?: string } } | null)?.role?.name ??
    session?.user?.role ??
    "";

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-slate-100">
          <UserIcon className="h-5 w-5 text-slate-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold">Profile</h1>
          <p className="text-muted-foreground text-sm">
            Your account details
          </p>
        </div>
        <Button asChild>
          <Link href="/settings">
            <Pencil className="mr-2 h-4 w-4" />
            Edit profile
          </Link>
        </Button>
      </div>

      {/* Hero: photo or initials */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
        <div className="h-24 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900" />
        <div className="px-6 pb-6 -mt-12 flex flex-col sm:flex-row sm:items-end gap-4">
          <Avatar className="h-24 w-24 shrink-0 ring-4 ring-background shadow-md">
            <AvatarImage src={me?.profileImage?.url} alt="" />
            <AvatarFallback className="bg-blue-600 text-white text-3xl font-semibold">
              {initialsFromName(me?.fullName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 pt-2 sm:pt-0 sm:pb-1">
            <h2 className="text-xl font-semibold truncate">
              {me?.fullName ?? "—"}
            </h2>
            <p className="text-sm text-muted-foreground truncate">
              {me?.email ?? session?.user?.email}
            </p>
            {roleLabel ? (
              <p className="text-xs text-blue-600 capitalize mt-1">{roleLabel}</p>
            ) : null}
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
          <CardDescription>
            Information shown here is read-only. Use Settings to make changes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-0 divide-y">
          <DetailRow label="Full name" value={me?.fullName} />
          <DetailRow label="Email" value={me?.email} />
          <DetailRow label="Phone" value={me?.phone} />
          <DetailRow
            label="Website"
            value={me?.website}
            isLink
          />
          <div className="py-4 first:pt-0">
            <p className="text-sm font-medium text-muted-foreground mb-1">Bio</p>
            <p className="text-sm whitespace-pre-wrap">
              {me?.description?.trim() ? me.description : "—"}
            </p>
          </div>
          {me?.createdAt ? (
            <DetailRow
              label="Member since"
              value={new Date(me.createdAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            />
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function DetailRow({
  label,
  value,
  isLink,
}: {
  label: string;
  value?: string | null;
  isLink?: boolean;
}) {
  const display = value?.trim() ? value : "—";
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 py-4 first:pt-0">
      <p className="text-sm font-medium text-muted-foreground sm:w-36 shrink-0">
        {label}
      </p>
      {isLink && value?.trim() ? (
        <a
          href={value.startsWith("http") ? value : `https://${value}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1 break-all"
        >
          {value}
          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
        </a>
      ) : (
        <p className="text-sm break-all">{display}</p>
      )}
    </div>
  );
}

"use client";

import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import type { DashboardStats } from "@/types";
import { StatsCard } from "@/components/dashboard/stats-card";
import {
  Users,
  MapPin,
  BookOpen,
  Clock,
  TrendingUp,
  CheckCircle,
  Star,
  AlertCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const GrowthChart = dynamic(
  () => import("@/components/dashboard/charts").then((m) => m.GrowthChart),
  { ssr: false, loading: () => <Skeleton className="h-60 w-full rounded" /> }
);

const PlaceStatusChart = dynamic(
  () => import("@/components/dashboard/charts").then((m) => m.PlaceStatusChart),
  { ssr: false, loading: () => <Skeleton className="h-60 w-full rounded" /> }
);

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-72 rounded-lg" />
        <Skeleton className="h-72 rounded-lg" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: stats, isLoading, error } = useQuery<DashboardStats>({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const { data } = await api.get<DashboardStats>("/admin/stats");
      return data;
    },
    staleTime: 60_000,
  });

  if (isLoading) return <DashboardSkeleton />;

  if (error || !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
        <AlertCircle className="h-10 w-10" />
        <p>Failed to load dashboard statistics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here&apos;s what&apos;s happening.</p>
      </div>

      {/* ── Stats grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Users"
          value={stats.totalUsers}
          icon={Users}
          color="blue"
          description="Registered accounts"
        />
        <StatsCard
          title="Total Places"
          value={stats.totalPlaces}
          icon={MapPin}
          color="green"
          description={`${stats.verifiedPlaces} approved`}
        />
        <StatsCard
          title="Pending Places"
          value={stats.pendingPlaces}
          icon={Clock}
          color="orange"
          description="Awaiting approval"
        />
        <StatsCard
          title="Blog Posts"
          value={stats.totalBlogs}
          icon={BookOpen}
          color="purple"
          description="Total articles"
        />
        <StatsCard
          title="Total Reviews"
          value={stats.totalReviews}
          icon={Star}
          color="yellow"
          description={`${stats.pendingReviews} pending`}
        />
        <StatsCard
          title="Approved Places"
          value={stats.verifiedPlaces}
          icon={CheckCircle}
          color="green"
          description="Live on the platform"
        />
        <StatsCard
          title="Pending Reviews"
          value={stats.pendingReviews}
          icon={Clock}
          color="orange"
          description="Reviews awaiting moderation"
        />
        <StatsCard
          title="Rejected Places"
          value={stats.rejectedPlaces}
          icon={AlertCircle}
          color="red"
          description="Declined submissions"
        />
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Growth chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Growth Overview
            </CardTitle>
            <CardDescription>Monthly new users and places (last 7 months)</CardDescription>
          </CardHeader>
          <CardContent>
            <GrowthChart data={stats.growthData} />
          </CardContent>
        </Card>

        {/* Place status chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Place Status
            </CardTitle>
            <CardDescription>
              Approved {stats.verifiedPlaces} · Pending {stats.pendingPlaces} · Rejected {stats.rejectedPlaces}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PlaceStatusChart data={stats.placeStatus} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

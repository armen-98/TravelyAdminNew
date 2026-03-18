"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
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
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  Legend,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

interface AdminStats {
  totalUsers: number;
  totalPlaces: number;
  pendingPlaces: number;
  verifiedPlaces: number;
  rejectedPlaces: number;
  totalReviews: number;
  pendingReviews: number;
  totalBlogs: number;
  placeStatus: { name: string; value: number }[];
  growthData: { month: string; users: number; places: number }[];
}

const STATUS_COLORS: Record<string, string> = {
  Approved: "#10b981",
  Pending:  "#f59e0b",
  Rejected: "#ef4444",
};

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
  const { data: stats, isLoading, error } = useQuery<AdminStats>({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const { data } = await api.get<AdminStats>("/admin/stats");
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
            {stats.growthData.length === 0 ? (
              <div className="h-60 flex items-center justify-center text-muted-foreground text-sm">
                No growth data yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={stats.growthData}>
                  <defs>
                    <linearGradient id="usersGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}   />
                    </linearGradient>
                    <linearGradient id="placesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}   />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="users"
                    name="Users"
                    stroke="#3b82f6"
                    fill="url(#usersGrad)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="places"
                    name="Places"
                    stroke="#10b981"
                    fill="url(#placesGrad)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
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
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={stats.placeStatus} barSize={56}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" name="Places" radius={[6, 6, 0, 0]}>
                  {stats.placeStatus.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={STATUS_COLORS[entry.name] ?? "#6366f1"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

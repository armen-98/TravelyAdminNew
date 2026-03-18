"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable, Column } from "@/components/tables/data-table";
import { useUsers, useActivateUser, useDeactivateUser } from "@/hooks/use-users";
import type { User } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, UserCheck, UserX, Eye, Users } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function UsersPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useUsers({ page });
  const activate = useActivateUser();
  const deactivate = useDeactivateUser();

  const columns: Column<User>[] = [
    {
      key: "fullName",
      header: "User",
      cell: (user) => {
        const inits = user.fullName
          ?.split(" ")
          .map((n) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();
        return (
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => router.push(`/users/${user.id}`)}
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.profileImage?.url} />
              <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-semibold">
                {inits}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm hover:text-blue-600 transition-colors">
                {user.fullName}
              </p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: "role",
      header: "Role",
      cell: (user) => {
        const role = user.role?.name ?? "user";
        const variants: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
          "super-admin": "destructive",
          admin: "default",
          moderator: "secondary",
          business: "outline",
          user: "outline",
        };
        return <Badge variant={variants[role] ?? "outline"}>{role}</Badge>;
      },
    },
    {
      key: "isActive",
      header: "Status",
      cell: (user) => (
        <Badge variant={user.isActive ? "success" : "destructive"}>
          {user.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "isPro",
      header: "Plan",
      cell: (user) => (
        <Badge variant={user.isPro ? "default" : "outline"}>
          {user.isPro ? "Pro" : "Free"}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: "Joined",
      cell: (user) => (
        <span className="text-sm text-muted-foreground">{formatDate(user.createdAt)}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      cell: (user) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push(`/users/${user.id}`)}>
              <Eye className="mr-2 h-4 w-4" />
              View Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {user.isActive ? (
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600"
                onClick={() => deactivate.mutate(user.id)}
              >
                <UserX className="mr-2 h-4 w-4" />
                Deactivate
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                className="text-green-600 focus:text-green-600"
                onClick={() => activate.mutate(user.id)}
              >
                <UserCheck className="mr-2 h-4 w-4" />
                Activate
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-blue-100">
          <Users className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-muted-foreground text-sm">
            Manage user accounts and permissions
            {data?.total ? ` · ${data.total} total` : ""}
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={(data?.data ?? []) as User[]}
        isLoading={isLoading}
        searchKey="fullName"
        searchPlaceholder="Search by name..."
        page={page}
        totalPages={data?.totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}

"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
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
import { MoreHorizontal, UserCheck, UserX, Eye, Users } from "lucide-react";
import { formatDate, getRoleBadgeVariant } from "@/lib/utils";
import { canManageUsers } from "@/lib/permissions";

export default function UsersPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [deactivateTarget, setDeactivateTarget] = useState<User | null>(null);
  const { data: session } = useSession();
  const sessionRole = session?.user?.role;

  const { data, isLoading } = useUsers({ page, search: search || undefined });
  const activate = useActivateUser();
  const deactivate = useDeactivateUser();

  const columns: Column<User>[] = useMemo(() => [
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
        return <Badge variant={getRoleBadgeVariant(role)}>{role}</Badge>;
      },
    },
    {
      key: "isActive",
      header: "Status",
      cell: (user) => (
        <div className="flex flex-col gap-1">
          <Badge className='w-fit' variant={user.deletedAt ? "destructive" : user.isActive ? "success" : "destructive"}>
            {user.deletedAt ? "Deleted" : user.isActive ? "Active" : "Inactive"}
          </Badge>
          {user.deletedAt && (
            <>
              <span className="text-xs text-muted-foreground">
                {user.deletedBy === "self" ? "Deleted by own account" : "Deleted account"}
              </span>
              <span className="text-xs text-muted-foreground">
                Reason: {user.deletionReason || "User deleted own account"}
              </span>
            </>
          )}
        </div>
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
            {canManageUsers(sessionRole) && (
              <>
                <DropdownMenuSeparator />
                {user.deletedAt ? null : user.isActive ? (
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600"
                    onClick={() => setDeactivateTarget(user)}
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
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [sessionRole, router, activate, deactivate]);

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
        searchPlaceholder="Search by name or email..."
        onSearch={(val) => { setSearch(val); setPage(1); }}
        page={page}
        totalPages={data?.totalPages}
        onPageChange={setPage}
      />

      <AlertDialog
        open={!!deactivateTarget}
        onOpenChange={(open) => {
          if (!open) setDeactivateTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate{" "}
              <strong>{deactivateTarget?.fullName}</strong>? They will lose
              access to their account immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (deactivateTarget) deactivate.mutate(deactivateTarget.id);
                setDeactivateTarget(null);
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

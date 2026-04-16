"use client";

import { useEffect, useState } from "react";
import { useSession, signOut, signIn } from "next-auth/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Bug, LogOut, User as UserIcon, Settings } from "lucide-react";
import Link from "next/link";
import axios from "axios";
import { toast } from "sonner";
import api, {
  getApiEnvironment,
  setApiEnvironment,
  resolveApiBaseUrl,
  DEFAULT_API_ENVIRONMENT,
  type ApiEnvironment,
} from "@/lib/api";
import type { User as MeUser } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MobileNav } from "./mobile-nav";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function Header() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [apiEnvironment, setApiEnvironmentState] = useState<ApiEnvironment>(() =>
    typeof window !== "undefined" ? getApiEnvironment() : DEFAULT_API_ENVIRONMENT
  );
  const [isSwitching, setIsSwitching] = useState(false);
  const [canUseLocalEnvironment, setCanUseLocalEnvironment] = useState(false);

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const { data } = await api.get<{ data: MeUser }>("/users/me");
      return data.data ?? data;
    },
  });

  const displayName = me?.fullName ?? session?.user?.name;
  const isAdmin = session?.user?.role === "admin" || session?.user?.role === "super-admin";
  const initials = displayName
    ?.split(/\s+/)
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  useEffect(() => {
    setApiEnvironmentState(getApiEnvironment());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const host = window.location.hostname;
    setCanUseLocalEnvironment(
      host === "localhost" || host === "127.0.0.1" || host === "::1"
    );
  }, []);

  const handleEnvironmentChange = async (value: string) => {
    const env = value as ApiEnvironment;
    const email = session?.user?.email;
    if (!email) return;

    const previousEnv = getApiEnvironment();
    if (env === previousEnv) return;

    setIsSwitching(true);
    // Switch axios base URL immediately so the token-by-email call goes to the new env
    setApiEnvironment(env);
    setApiEnvironmentState(env);

    try {
      const newBaseUrl = resolveApiBaseUrl(env);
      const { data } = await axios.post<{ user: { id: number; fullName: string; email: string; role: { id: number; name: string } }; token: string }>(
        `${newBaseUrl}/auth/token-by-email`,
        { email }
      );

      // Re-establish session with the fresh token from the new environment
      await signIn("credentials", {
        id: String(data.user.id),
        email: data.user.email,
        name: data.user.fullName,
        role: data.user.role?.name,
        accessToken: data.token,
        redirect: false,
      });

      // Update the axios instance with the new token and invalidate cached queries
      api.defaults.baseURL = newBaseUrl;
      await queryClient.invalidateQueries();
      toast.success(`Switched to ${env}`);
    } catch {
      // Revert if the new environment can't authenticate this user
      setApiEnvironment(previousEnv);
      setApiEnvironmentState(previousEnv);
      toast.error(`Could not authenticate on ${env}. Reverted.`);
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/95 backdrop-blur px-4 md:px-6 gap-4">
      <div className="flex items-center gap-3">
        <MobileNav />
      </div>

      <div className="flex items-center justify-end gap-1.5 sm:gap-2">
        {isAdmin ? (
          <Select
            value={apiEnvironment}
            disabled={isSwitching}
            onValueChange={handleEnvironmentChange}
          >
            <SelectTrigger className="h-9 w-[145px] text-xs sm:text-sm">
              <SelectValue placeholder="API Environment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="production">Production</SelectItem>
              <SelectItem value="staging">Staging</SelectItem>
              {canUseLocalEnvironment ? (
                <SelectItem value="local">Local</SelectItem>
              ) : null}
            </SelectContent>
          </Select>
        ) : null}
        {/* Notifications bell — same height as avatar for alignment */}
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 shrink-0 rounded-full"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-blue-500 ring-2 ring-background" />
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9 shrink-0 rounded-full p-0"
            >
              <Avatar className="h-9 w-9">
                <AvatarImage
                  src={me?.profileImage?.url ?? ""}
                  alt={displayName ?? ""}
                />
                <AvatarFallback className="bg-blue-600 text-white text-sm font-semibold">
                  {initials ?? "?"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {displayName}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {session?.user?.email}
                </p>
                <p className="text-xs leading-none text-blue-600 capitalize">
                  {session?.user?.role}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile">
                <UserIcon className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

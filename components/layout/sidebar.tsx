"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useSession } from "next-auth/react";
import { navItems } from "@/lib/nav";

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { data: session } = useSession();
  const role = session?.user?.role ?? "";
  const visibleItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "relative hidden md:flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
          <Link
            href="/"
            className="flex items-center gap-2.5 shrink-0 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/travely-logo.svg"
              alt=""
              width={36}
              height={36}
              className="h-9 w-9"
            />
            {!collapsed && (
              <span className="font-bold text-sidebar-foreground text-lg">
                Travely
              </span>
            )}
          </Link>
        </div>

        {/* Nav */}
        <ScrollArea className="flex-1 py-4">
          <nav className="space-y-1 px-2">
            {visibleItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return collapsed ? (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center justify-center w-full h-10 rounded-md transition-colors",
                        isActive
                          ? "bg-sidebar-primary text-sidebar-primary-foreground"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">{item.title}</TooltipContent>
                </Tooltip>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {item.title}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        {/* Collapse button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute -right-3 top-20 flex items-center justify-center w-6 h-6 rounded-full bg-background border border-border text-muted-foreground hover:text-foreground transition-colors shadow-sm"
        >
          {collapsed ? (
            <ChevronRight className="w-3 h-3" />
          ) : (
            <ChevronLeft className="w-3 h-3" />
          )}
        </button>
      </aside>
    </TooltipProvider>
  );
}

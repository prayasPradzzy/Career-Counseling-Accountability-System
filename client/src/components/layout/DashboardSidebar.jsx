"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { NAV_ITEMS } from "@/constants/navigation";
import { getIcon } from "@/lib/iconRegistry";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function DashboardSidebar() {
  const pathname = usePathname();
  const { user, logout, isLoggingOut } = useAuth();

  const userRole = user?.role || "student";
  const userInitials =
    user?.firstName && user?.lastName
      ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
      : "U";

  const filteredNavItems = NAV_ITEMS.filter(
    (item) => !item.allowedRoles || item.allowedRoles.includes(userRole)
  );

  return (
    <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card">
      {/* Brand */}
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-black">
          C
        </span>
        <span className="font-bold tracking-tight text-foreground">
          CareerPath
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 p-3 overflow-y-auto">
        <p className="px-3 py-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Main Menu
        </p>
        {filteredNavItems.map((item) => {
          const Icon = getIcon(item.iconName);
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const displayLabel = item.labelByRole?.[userRole] || item.label;

          return (
            <Link
              key={item.id}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground active:scale-[0.98]"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {displayLabel}
            </Link>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="border-t border-border p-3 space-y-2">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <Avatar className="size-8">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-sm font-medium truncate">
              {user?.firstName} {user?.lastName}
            </span>
            <span className="text-xs text-muted-foreground truncate capitalize">
              {user?.role || "User"}
            </span>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-destructive hover:border-destructive/30"
          onClick={() => logout()}
          disabled={isLoggingOut}
        >
          <LogOut className="mr-2 size-4" />
          {isLoggingOut ? "Signing out..." : "Sign Out"}
        </Button>
      </div>
    </aside>
  );
}

export default DashboardSidebar;

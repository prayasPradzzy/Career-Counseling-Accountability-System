"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { NAV_ITEMS } from "@/constants/navigation";
import { getIcon } from "@/lib/iconRegistry";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export function MobileNavigation({ open, onOpenChange }) {
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 p-0 flex flex-col">
        {/* Brand Header */}
        <SheetHeader className="h-16 border-b border-border px-6 flex items-center justify-start">
          <SheetTitle className="flex items-center gap-2 text-left">
            <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-black">
              C
            </span>
            <span className="font-bold tracking-tight text-foreground text-base">
              CareerPath
            </span>
          </SheetTitle>
        </SheetHeader>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
          <p className="px-3 py-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Main Menu
          </p>
          {filteredNavItems.map((item) => {
            const Icon = getIcon(item.iconName);
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => onOpenChange?.(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <Icon className="size-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="border-t border-border p-4 space-y-3">
          <div className="flex items-center gap-3">
            <Avatar className="size-9">
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
            onClick={() => {
              onOpenChange?.(false);
              logout();
            }}
            disabled={isLoggingOut}
          >
            <LogOut className="mr-2 size-4" />
            {isLoggingOut ? "Signing out..." : "Sign Out"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default MobileNavigation;

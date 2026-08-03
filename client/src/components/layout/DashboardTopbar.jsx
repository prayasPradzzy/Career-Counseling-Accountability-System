"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, Menu, Search } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { Button } from "@/components/ui/button";
import { UserMenu } from "./UserMenu";
import { MobileNavigation } from "./MobileNavigation";
import { Breadcrumbs } from "./Breadcrumbs";

export function DashboardTopbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-card/80 backdrop-blur-sm px-4 md:px-6">
        {/* Mobile menu trigger */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open navigation menu"
          id="topbar-mobile-menu-trigger"
        >
          <Menu className="size-5" />
        </Button>

        {/* Search bar & Breadcrumbs container */}
        <div className="flex flex-1 items-center gap-4">
          <div className="relative hidden sm:flex items-center max-w-xs w-full">
            <Search className="absolute left-3 size-4 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              placeholder="Search sessions, counselors…"
              className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
              id="topbar-search-input"
              aria-label="Global search input"
            />
          </div>

          <Breadcrumbs className="hidden lg:flex" />
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label="View notifications"
            id="topbar-notifications-button"
            className="relative"
            asChild
          >
            <Link href={ROUTES.NOTIFICATIONS}>
              <Bell className="size-5" />
              <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-destructive" />
            </Link>
          </Button>

          <UserMenu />
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      <MobileNavigation
        open={mobileMenuOpen}
        onOpenChange={setMobileMenuOpen}
      />
    </>
  );
}

export default DashboardTopbar;

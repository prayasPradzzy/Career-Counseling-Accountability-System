"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

const ROUTE_LABELS = {
  dashboard: "Dashboard",
  students: "Students",
  new: "Register Student",
  sessions: "Sessions",
  counselors: "Counselors",
  assessments: "Assessments",
  profile: "Profile",
  settings: "Settings",
  notifications: "Notifications",
  analytics: "Analytics",
  workspace: "Interview Workspace",
  reports: "Reports",
  recommendations: "Recommendations",
  careers: "Career Database",
  progress: "Child Progress",
  admin: "Admin",
};

/**
 * Reusable Breadcrumbs Component
 * Automatically generates breadcrumb links based on current path segments.
 */
export function Breadcrumbs({ className }) {
  const pathname = usePathname();

  // Split path segments, ignoring empty strings
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  let currentPath = "";

  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center text-xs font-medium text-muted-foreground", className)}>
      <ol className="flex items-center gap-1.5 flex-wrap">
        <li>
          <Link href={ROUTES.DASHBOARD} className="hover:text-foreground transition-colors">
            Home
          </Link>
        </li>

        {segments.map((segment, index) => {
          currentPath += `/${segment}`;
          const isLast = index === segments.length - 1;
          const label = ROUTE_LABELS[segment] || (segment.length > 20 ? "Detail" : segment);

          return (
            <li key={currentPath} className="flex items-center gap-1.5">
              <ChevronRight className="size-3.5 text-muted-foreground/60 shrink-0" />
              {isLast ? (
                <span className="font-semibold text-foreground" aria-current="page">
                  {label}
                </span>
              ) : (
                <Link href={currentPath} className="hover:text-foreground transition-colors">
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default Breadcrumbs;

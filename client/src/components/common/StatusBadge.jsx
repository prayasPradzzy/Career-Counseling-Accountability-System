import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { STUDENT_STATUS_CONFIGS } from "@/constants/studentStatus.constants";

/**
 * Reusable StatusBadge Component
 * Standardized status indicators across the platform using Student Lifecycle Status constants.
 */
const LEGACY_STATUS_CONFIGS = {
  active: { label: "Active", className: "bg-emerald-500/10 text-emerald-600 border-emerald-600/30 dark:text-emerald-400" },
  available: { label: "Available", className: "bg-emerald-500/10 text-emerald-600 border-emerald-600/30 dark:text-emerald-400" },
  completed: { label: "Completed", className: "bg-emerald-500/10 text-emerald-600 border-emerald-600/30 dark:text-emerald-400" },
  published: { label: "Published", className: "bg-emerald-500/10 text-emerald-600 border-emerald-600/30 dark:text-emerald-400" },

  pending: { label: "Pending", className: "bg-amber-500/10 text-amber-600 border-amber-600/30 dark:text-amber-400" },
  "in-progress": { label: "In Progress", className: "bg-amber-500/10 text-amber-600 border-amber-600/30 dark:text-amber-400" },
  scheduled: { label: "Scheduled", className: "bg-blue-500/10 text-blue-600 border-blue-600/30 dark:text-blue-400" },
  draft: { label: "Draft", className: "bg-muted text-muted-foreground border-border" },

  busy: { label: "Busy", className: "bg-secondary text-secondary-foreground" },
  archived: { label: "Archived", className: "bg-muted text-muted-foreground" },
  cancelled: { label: "Cancelled", className: "bg-destructive/10 text-destructive border-destructive/20" },
  abandoned: { label: "Abandoned", className: "bg-destructive/10 text-destructive border-destructive/20" },

  // Assessment Assignment statuses (uppercase enum values from backend)
  assigned: { label: "Assigned", className: "bg-blue-500/10 text-blue-600 border-blue-600/30 dark:text-blue-400" },
  in_progress: { label: "In Progress", className: "bg-amber-500/10 text-amber-600 border-amber-600/30 dark:text-amber-400" },
  under_review: { label: "Completed", className: "bg-emerald-500/10 text-emerald-600 border-emerald-600/30 dark:text-emerald-400" },
  approved: { label: "Approved", className: "bg-emerald-500/10 text-emerald-600 border-emerald-600/30 dark:text-emerald-400" },
  rejected: { label: "Retake Required", className: "bg-destructive/10 text-destructive border-destructive/20" },
  expired: { label: "Expired", className: "bg-muted text-muted-foreground border-border" },
};

export function StatusBadge({ status, label, size = "default", className }) {
  const rawStatus = status || "";
  const normalizedLower = rawStatus.toLowerCase();

  // 1. Look up exact constant key (e.g. COUNSELOR_ASSIGNED)
  const lifecycleConfig = STUDENT_STATUS_CONFIGS[rawStatus];

  // 2. Look up legacy lowercase key (e.g. active, completed)
  const legacyConfig = LEGACY_STATUS_CONFIGS[normalizedLower] || STUDENT_STATUS_CONFIGS[normalizedLower];

  const config = lifecycleConfig || legacyConfig || {
    label: label || (rawStatus ? rawStatus.replace(/_/g, " ") : "Unknown"),
    className: "bg-muted text-muted-foreground",
  };

  return (
    <Badge
      variant={config.badgeVariant || "outline"}
      className={cn(
        "font-medium transition-colors whitespace-nowrap",
        size === "sm" ? "text-[10px] px-1.5 py-0" : "text-xs px-2 py-0.5",
        config.className,
        className
      )}
    >
      {label || config.label}
    </Badge>
  );
}

export default StatusBadge;

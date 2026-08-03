import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "./StatusBadge";
import { getIcon } from "@/lib/iconRegistry";
import { cn } from "@/lib/utils";

/**
 * Reusable TimelineCard Component
 * Displays chronological activity items with status dots, icons, and timestamps.
 */
export function TimelineCard({
  title,
  description,
  timestamp,
  status,
  iconName = "Calendar",
  className,
}) {
  const IconComponent = getIcon(iconName);

  return (
    <div className={cn("relative pl-6 pb-6 last:pb-0 border-l border-border/70 ml-3", className)}>
      {/* Icon Node Dot */}
      <div className="absolute -left-3 top-0 flex size-6 items-center justify-center rounded-full bg-background border border-border shadow-xs text-primary">
        <IconComponent className="size-3" />
      </div>

      <div className="space-y-1 bg-card border border-border rounded-lg p-3 shadow-xs">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-foreground truncate">{title}</span>
          {status && <StatusBadge status={status} size="sm" />}
        </div>
        {timestamp && <span className="text-[11px] text-muted-foreground block">{timestamp}</span>}
        {description && <p className="text-xs text-muted-foreground leading-relaxed pt-1">{description}</p>}
      </div>
    </div>
  );
}

export default TimelineCard;

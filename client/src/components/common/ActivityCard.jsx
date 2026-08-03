import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getIcon } from "@/lib/iconRegistry";
import { cn } from "@/lib/utils";

/**
 * Reusable ActivityCard Component
 * Displays activity feed row with avatar or icon, title, description, and timestamp.
 */
export function ActivityCard({
  title,
  description,
  timestamp,
  userInitials,
  iconName,
  action,
  className,
}) {
  const IconComponent = iconName ? getIcon(iconName) : null;

  return (
    <Card className={cn("border-border shadow-xs hover:border-primary/30 transition-colors", className)}>
      <CardContent className="p-4 flex items-start gap-3.5">
        {userInitials ? (
          <Avatar className="size-9 border border-border shrink-0 mt-0.5">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              {userInitials}
            </AvatarFallback>
          </Avatar>
        ) : IconComponent ? (
          <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
            <IconComponent className="size-4" />
          </div>
        ) : null}

        <div className="flex-1 min-w-0 space-y-0.5">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-foreground truncate">{title}</h4>
            {timestamp && <span className="text-[11px] text-muted-foreground shrink-0">{timestamp}</span>}
          </div>
          {description && <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>}
        </div>

        {action && <div className="shrink-0">{action}</div>}
      </CardContent>
    </Card>
  );
}

export default ActivityCard;

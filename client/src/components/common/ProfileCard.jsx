import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "./StatusBadge";
import { RoleBadge } from "./RoleBadge";
import { cn } from "@/lib/utils";

/**
 * Reusable ProfileCard Component
 * Displays user/counselor avatar, names, badges, metadata points, and action slots.
 */
export function ProfileCard({
  name,
  initials,
  subtitle,
  role,
  status,
  statusLabel,
  metaItems = [],
  action,
  className,
}) {
  const displayInitials =
    initials ||
    (name
      ? name
          .split(" ")
          .map((n) => n[0])
          .slice(0, 2)
          .join("")
          .toUpperCase()
      : "U");

  return (
    <Card className={cn("border-border shadow-xs hover:shadow-md hover:border-primary/40 transition-all duration-200 flex flex-col justify-between", className)}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Avatar className="size-14 border border-border shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-base">
              {displayInitials}
            </AvatarFallback>
          </Avatar>

          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-base text-foreground truncate">{name}</h3>
              {status && <StatusBadge status={status} label={statusLabel} />}
            </div>

            {subtitle && <p className="text-xs text-primary font-medium truncate">{subtitle}</p>}
            {role && <RoleBadge role={role} />}
          </div>
        </div>

        {metaItems.length > 0 && (
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-4 mt-4 border-t border-border">
            {metaItems.map((meta, idx) => (
              <div key={idx} className="min-w-0">
                <span className="block text-[10px] uppercase font-semibold text-muted-foreground/70">{meta.label}</span>
                <span className="font-medium text-foreground truncate block">{meta.value}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {action && <CardFooter className="p-6 pt-0 border-t border-border mt-2">{action}</CardFooter>}
    </Card>
  );
}

export default ProfileCard;

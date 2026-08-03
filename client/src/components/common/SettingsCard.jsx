import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getIcon } from "@/lib/iconRegistry";
import { cn } from "@/lib/utils";

/**
 * Reusable SettingsCard Component
 * Presentational setting item wrapper with title, description, and control slot.
 */
export function SettingsCard({
  title,
  description,
  iconName,
  children,
  className,
}) {
  const IconComponent = iconName ? getIcon(iconName) : null;

  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card shadow-xs", className)}>
      <div className="flex items-start gap-3">
        {IconComponent && (
          <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
            <IconComponent className="size-4" />
          </div>
        )}
        <div className="space-y-0.5">
          <h4 className="text-sm font-medium text-foreground">{title}</h4>
          {description && <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>}
        </div>
      </div>

      {children && <div className="shrink-0">{children}</div>}
    </div>
  );
}

export default SettingsCard;

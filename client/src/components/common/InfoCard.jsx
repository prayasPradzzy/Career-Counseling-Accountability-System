import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getIcon } from "@/lib/iconRegistry";
import { cn } from "@/lib/utils";

/**
 * Reusable InfoCard Component
 * Displays structured key-value information grid or list.
 */
export function InfoCard({
  title,
  subtitle,
  iconName,
  items = [],
  cols = 2,
  className,
}) {
  const IconComponent = iconName ? getIcon(iconName) : null;

  return (
    <Card className={cn("border-border shadow-sm", className)}>
      {(title || subtitle) && (
        <CardHeader className="flex flex-row items-center gap-3 pb-3">
          {IconComponent && (
            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
              <IconComponent className="size-5" />
            </div>
          )}
          <div>
            {title && <CardTitle className="text-base font-semibold">{title}</CardTitle>}
            {subtitle && <CardDescription className="text-xs text-muted-foreground">{subtitle}</CardDescription>}
          </div>
        </CardHeader>
      )}

      <CardContent className="pt-2">
        <div className={cn("grid gap-4 text-sm", cols === 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2")}>
          {items.map((item, index) => (
            <div key={item.label || index} className="space-y-0.5 min-w-0">
              <span className="text-xs text-muted-foreground block truncate">{item.label}</span>
              <div className="font-medium text-foreground truncate">{item.value || "N/A"}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default InfoCard;

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getIcon } from "@/lib/iconRegistry";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

/**
 * Reusable StatCard Component
 * Metric display card supporting values, trend indicators, icons, and color themes.
 */
export function StatCard({
  title,
  value,
  note,
  iconName = "BarChart3",
  icon: CustomIcon,
  trend,
  trendDirection = "up",
  variant = "default",
  className,
}) {
  const IconComponent = CustomIcon || getIcon(iconName);

  const variantStyles = {
    default: "bg-primary/10 text-primary",
    success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    destructive: "bg-destructive/10 text-destructive",
  };

  return (
    <Card className={cn("border-border shadow-xs hover:shadow-md hover:border-primary/30 transition-all duration-200", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {title}
        </CardTitle>
        <div className={cn("p-2 rounded-lg shrink-0", variantStyles[variant] || variantStyles.default)}>
          <IconComponent className="size-4" />
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="flex items-baseline justify-between gap-2">
          <div className="text-2xl font-bold tracking-tight text-foreground">{value}</div>
          {trend && (
            <div
              className={cn(
                "flex items-center text-xs font-semibold gap-0.5",
                trendDirection === "up" ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
              )}
            >
              {trendDirection === "up" ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
              <span>{trend}</span>
            </div>
          )}
        </div>
        {note && <p className="text-xs text-muted-foreground">{note}</p>}
      </CardContent>
    </Card>
  );
}

export default StatCard;

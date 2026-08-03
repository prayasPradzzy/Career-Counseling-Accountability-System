import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getIcon } from "@/lib/iconRegistry";
import { cn } from "@/lib/utils";

/**
 * Reusable ProgressCard Component
 * Displays progress metrics with title, progress bar, percentage, and steps.
 */
export function ProgressCard({
  title,
  subtitle,
  percentage = 0,
  currentStep,
  totalSteps,
  iconName = "Target",
  note,
  className,
}) {
  const IconComponent = getIcon(iconName);
  const clampedPercentage = Math.min(100, Math.max(0, percentage));

  return (
    <Card className={cn("border-border shadow-sm", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
            <IconComponent className="size-5" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold">{title}</CardTitle>
            {subtitle && <CardDescription className="text-xs text-muted-foreground">{subtitle}</CardDescription>}
          </div>
        </div>

        <span className="text-xl font-bold text-foreground">{clampedPercentage}%</span>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Progress Bar */}
        <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${clampedPercentage}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {currentStep && totalSteps ? (
            <span>
              Step <strong className="text-foreground">{currentStep}</strong> of {totalSteps}
            </span>
          ) : (
            <span>Completion Rate</span>
          )}
          {note && <span>{note}</span>}
        </div>
      </CardContent>
    </Card>
  );
}

export default ProgressCard;

import { Button } from "@/components/ui/button";
import { getIcon } from "@/lib/iconRegistry";
import { cn } from "@/lib/utils";

/**
 * Reusable EmptyState Component
 * Displays icon, title, description, and primary CTA when data arrays are empty.
 */
export function EmptyState({
  iconName = "Inbox",
  icon: CustomIcon,
  title = "No data found",
  description = "There are no items to display at this time.",
  actionLabel,
  onAction,
  actionHref,
  className,
}) {
  const IconComponent = CustomIcon || getIcon(iconName);

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 md:p-12 rounded-xl border border-dashed border-border bg-card/50 my-4 space-y-4",
        className
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <IconComponent className="size-6 shrink-0" />
      </div>

      <div className="space-y-1.5 max-w-sm">
        <h3 className="text-lg font-semibold tracking-tight text-foreground">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>

      {actionLabel && (onAction || actionHref) && (
        <div className="pt-2">
          {actionHref ? (
            <Button asChild>
              <a href={actionHref}>{actionLabel}</a>
            </Button>
          ) : (
            <Button onClick={onAction}>{actionLabel}</Button>
          )}
        </div>
      )}
    </div>
  );
}

export default EmptyState;

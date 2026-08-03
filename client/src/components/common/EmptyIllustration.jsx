import { Button } from "@/components/ui/button";
import { getIcon } from "@/lib/iconRegistry";
import { cn } from "@/lib/utils";

/**
 * Reusable EmptyIllustration Component
 * Rich visual presentation for empty data states.
 */
export function EmptyIllustration({
  title = "No Items Available",
  description = "There are no records to display right now.",
  iconName = "Inbox",
  icon: CustomIcon,
  actionLabel,
  onAction,
  actionHref,
  className,
}) {
  const IconComponent = CustomIcon || getIcon(iconName);

  return (
    <div className={cn("flex flex-col items-center justify-center text-center p-8 sm:p-12 border border-dashed border-border rounded-2xl bg-card/40 my-4 space-y-4", className)}>
      <div className="relative flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-xs">
        <IconComponent className="size-8" />
        <span className="absolute -top-1 -right-1 size-3 rounded-full bg-primary animate-ping opacity-75" />
      </div>

      <div className="space-y-1.5 max-w-sm">
        <h3 className="text-lg font-bold tracking-tight text-foreground">{title}</h3>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>

      {actionLabel && (onAction || actionHref) && (
        <div className="pt-2">
          {actionHref ? (
            <Button asChild className="font-semibold shadow-xs">
              <a href={actionHref}>{actionLabel}</a>
            </Button>
          ) : (
            <Button onClick={onAction} className="font-semibold shadow-xs">
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default EmptyIllustration;

import { cn } from "@/lib/utils";

/**
 * Reusable PageSection Component
 * Structural page section container with title, description, optional action CTA, and divider.
 */
export function PageSection({
  title,
  description,
  action,
  children,
  divider = false,
  className,
}) {
  return (
    <section className={cn("space-y-4", divider && "pb-6 border-b border-border/70", className)}>
      {(title || description || action) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            {title && <h2 className="text-xl font-bold tracking-tight text-foreground">{title}</h2>}
            {description && <p className="text-xs sm:text-sm text-muted-foreground">{description}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}

      {children}
    </section>
  );
}

export default PageSection;

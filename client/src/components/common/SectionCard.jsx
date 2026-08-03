import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getIcon } from "@/lib/iconRegistry";
import { cn } from "@/lib/utils";

/**
 * Reusable SectionCard Component
 * Wraps content sections with standard header, description, actions, and optional footer.
 */
export function SectionCard({
  title,
  description,
  subtitle,
  iconName,
  icon: CustomIcon,
  action,
  actions = [],
  footer,
  children,
  className,
  headerClassName,
  contentClassName,
}) {
  const IconComponent = CustomIcon || (iconName ? getIcon(iconName) : null);
  const displayDescription = subtitle || description;

  return (
    <Card className={cn("border-border shadow-xs hover:shadow-sm hover:border-primary/30 transition-all duration-200", className)}>
      {(title || displayDescription || action || actions.length > 0) && (
        <CardHeader className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4", headerClassName)}>
          <div className="flex items-center gap-3">
            {IconComponent && (
              <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                <IconComponent className="size-5" />
              </div>
            )}
            <div className="space-y-0.5">
              {title && <CardTitle className="text-base font-semibold">{title}</CardTitle>}
              {displayDescription && (
                <CardDescription className="text-xs text-muted-foreground leading-relaxed">
                  {displayDescription}
                </CardDescription>
              )}
            </div>
          </div>

          {/* Action slots */}
          {(action || actions.length > 0) && (
            <div className="flex items-center gap-2 shrink-0">
              {action}
              {actions.map((act, index) => (
                <div key={index}>{act}</div>
              ))}
            </div>
          )}
        </CardHeader>
      )}

      {children && <CardContent className={cn("pt-0", contentClassName)}>{children}</CardContent>}

      {footer && <CardFooter className="border-t border-border pt-4 text-xs text-muted-foreground">{footer}</CardFooter>}
    </Card>
  );
}

export default SectionCard;

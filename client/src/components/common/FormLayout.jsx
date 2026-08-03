import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Reusable Form Layout Components
 * Standardized structure for form grids, sections, rows, and action footers.
 */

export function FormLayout({ children, onSubmit, className }) {
  return (
    <form onSubmit={onSubmit} className={cn("space-y-6 w-full", className)}>
      {children}
    </form>
  );
}

export function FormSection({ title, description, children, className }) {
  return (
    <Card className={cn("border-border shadow-xs", className)}>
      {(title || description) && (
        <CardHeader className="pb-4 border-b border-border/60">
          {title && <CardTitle className="text-base font-semibold">{title}</CardTitle>}
          {description && <CardDescription className="text-xs text-muted-foreground">{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className="space-y-4 pt-6">{children}</CardContent>
    </Card>
  );
}

export function FormRow({ children, cols = 2, className }) {
  return (
    <div
      className={cn(
        "grid gap-4 w-full",
        cols === 1 ? "grid-cols-1" : cols === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2",
        className
      )}
    >
      {children}
    </div>
  );
}

export function FormActions({ children, className }) {
  return (
    <div className={cn("flex items-center justify-end gap-3 pt-4 border-t border-border mt-6", className)}>
      {children}
    </div>
  );
}

export default FormLayout;

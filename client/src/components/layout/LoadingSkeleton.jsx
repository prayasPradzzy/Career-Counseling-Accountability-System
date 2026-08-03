import { Skeleton } from "@/components/ui/skeleton";
import { WidgetGrid } from "./WidgetGrid";
import { cn } from "@/lib/utils";

/**
 * Reusable LoadingSkeleton Component
 * Renders page header & widget grid loading skeleton states.
 */
export function LoadingSkeleton({ cards = 4, className }) {
  return (
    <div className={cn("space-y-6 w-full animate-pulse", className)}>
      {/* Header skeleton */}
      <div className="space-y-2 pb-4 border-b border-border">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      {/* Grid skeleton */}
      <WidgetGrid cols={{ default: 1, sm: 2, lg: cards }}>
        {Array.from({ length: cards }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-card p-6 space-y-3"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="size-8 rounded-lg" />
            </div>
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </WidgetGrid>

      {/* Main content area skeleton */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}

export default LoadingSkeleton;

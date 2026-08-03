import { cn } from "@/lib/utils";

/**
 * Universal ContentWrapper Component
 * Container wrapper for all page content bodies with consistent responsive bounds and spacing.
 */
export function ContentWrapper({
  children,
  maxWidth = "max-w-7xl",
  className,
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full p-4 md:p-6 lg:p-8 space-y-6",
        maxWidth,
        className
      )}
    >
      {children}
    </div>
  );
}

export default ContentWrapper;

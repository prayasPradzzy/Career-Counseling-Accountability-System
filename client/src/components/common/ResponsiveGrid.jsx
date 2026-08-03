import { cn } from "@/lib/utils";

/**
 * Reusable ResponsiveGrid Component
 * Configurable grid layout supporting custom breakpoint mappings.
 */

const COLS_MAP = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  6: "grid-cols-6",
};

const SM_COLS_MAP = {
  1: "sm:grid-cols-1",
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-4",
};

const MD_COLS_MAP = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
};

const LG_COLS_MAP = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
};

export function ResponsiveGrid({
  children,
  cols = { default: 1, sm: 2, lg: 3 },
  gap = "gap-6",
  className,
}) {
  let gridClasses = "";

  if (typeof cols === "string") {
    gridClasses = cols;
  } else if (typeof cols === "number") {
    gridClasses = COLS_MAP[cols] || `grid-cols-${cols}`;
  } else if (typeof cols === "object" && cols !== null) {
    const base = COLS_MAP[cols.default || 1] || "grid-cols-1";
    const sm = cols.sm ? SM_COLS_MAP[cols.sm] || "" : "";
    const md = cols.md ? MD_COLS_MAP[cols.md] || "" : "";
    const lg = cols.lg ? LG_COLS_MAP[cols.lg] || "" : "";

    gridClasses = cn(base, sm, md, lg);
  }

  return (
    <div className={cn("grid w-full", gap, gridClasses, className)}>
      {children}
    </div>
  );
}

export default ResponsiveGrid;

import { cn } from "@/lib/utils";

/**
 * Fully Configurable WidgetGrid Component
 * Accepts responsive column prop configurations:
 *   - cols={{ default: 1, sm: 2, md: 3, lg: 4 }}
 *   - cols={3} (static number)
 *   - cols="1 md:grid-cols-2 lg:grid-cols-4" (Tailwind class string)
 */

const GRID_COLS_MAP = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
  6: "grid-cols-6",
};

const SM_GRID_COLS_MAP = {
  1: "sm:grid-cols-1",
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-4",
};

const MD_GRID_COLS_MAP = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
};

const LG_GRID_COLS_MAP = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  5: "lg:grid-cols-5",
  6: "lg:grid-cols-6",
};

export function WidgetGrid({
  children,
  cols = { default: 1, sm: 2, lg: 4 },
  gap = "gap-4",
  className,
}) {
  let gridColsClasses = "";

  if (typeof cols === "string") {
    gridColsClasses = cols.includes("grid-cols") ? cols : `grid-cols-${cols}`;
  } else if (typeof cols === "number") {
    gridColsClasses = GRID_COLS_MAP[cols] || `grid-cols-${cols}`;
  } else if (typeof cols === "object" && cols !== null) {
    const base = GRID_COLS_MAP[cols.default || cols.base || 1] || "grid-cols-1";
    const sm = cols.sm ? SM_GRID_COLS_MAP[cols.sm] || "" : "";
    const md = cols.md ? MD_GRID_COLS_MAP[cols.md] || "" : "";
    const lg = cols.lg ? LG_GRID_COLS_MAP[cols.lg] || "" : "";

    gridColsClasses = cn(base, sm, md, lg);
  }

  return (
    <div className={cn("grid w-full", gap, gridColsClasses, className)}>
      {children}
    </div>
  );
}

export default WidgetGrid;

"use client";

import { Card } from "@/components/ui/card";
import { SearchInput } from "./SearchInput";
import { Button } from "@/components/ui/button";
import { X, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Reusable FilterBar Component
 * Layout bar wrapping SearchInput, select filters, and active filter reset button.
 */
export function FilterBar({
  searchValue,
  onSearchChange,
  onSearchClear,
  searchPlaceholder = "Search...",
  filters = [],
  onResetFilters,
  hasActiveFilters = false,
  className,
}) {
  return (
    <Card className={cn("border-border shadow-xs p-4 bg-card", className)}>
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        {/* Search Input */}
        <div className="flex-1 w-full">
          <SearchInput
            value={searchValue}
            onChange={onSearchChange}
            onClear={onSearchClear}
            placeholder={searchPlaceholder}
          />
        </div>

        {/* Filter Dropdowns Container */}
        {filters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            {filters.map((filter, index) => (
              <div key={filter.id || index} className="min-w-[140px] flex-1 sm:flex-none">
                {filter.component}
              </div>
            ))}
          </div>
        )}

        {/* Reset Action */}
        {hasActiveFilters && onResetFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetFilters}
            className="text-xs text-muted-foreground hover:text-destructive shrink-0"
          >
            <X className="mr-1.5 size-3.5" />
            Reset
          </Button>
        )}
      </div>
    </Card>
  );
}

export default FilterBar;

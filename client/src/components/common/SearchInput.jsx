"use client";

import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Reusable SearchInput Component
 * Provides clean search text input with leading search icon and trailing clear button.
 */
export function SearchInput({
  value = "",
  onChange,
  onClear,
  placeholder = "Search...",
  className,
  id = "common-search-input",
}) {
  return (
    <div className={cn("relative flex items-center w-full", className)}>
      <Search className="absolute left-3 size-4 text-muted-foreground pointer-events-none" />
      <Input
        id={id}
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="pl-9 pr-8 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring"
      />
      {value && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-2.5 p-0.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Clear search input"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}

export default SearchInput;

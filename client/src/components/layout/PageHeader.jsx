"use client";

import Link from "next/link";
import { Breadcrumbs } from "./Breadcrumbs";
import { Button } from "@/components/ui/button";
import { getIcon } from "@/lib/iconRegistry";
import { cn } from "@/lib/utils";

/**
 * Extensible PageHeader Component
 * Supports: title, subtitle, breadcrumbs (boolean or custom element), actions[]
 * Future modules can supply custom action buttons or headers without modifying PageHeader.
 */
export function PageHeader({
  title,
  subtitle,
  description,
  breadcrumbs = true,
  actions = [],
  children,
  className,
}) {
  const displaySubtitle = subtitle || description;

  return (
    <div className={cn("space-y-3 pb-4 border-b border-border/60 mb-6", className)}>
      {/* Breadcrumbs */}
      {breadcrumbs === true && <Breadcrumbs />}
      {breadcrumbs && typeof breadcrumbs !== "boolean" && breadcrumbs}

      {/* Main Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          {title && (
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              {title}
            </h1>
          )}
          {displaySubtitle && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {displaySubtitle}
            </p>
          )}
        </div>

        {/* Action CTAs */}
        {actions.length > 0 && (
          <div className="flex items-center gap-2.5 shrink-0">
            {actions.map((action, index) => {
              const Icon = action.iconName ? getIcon(action.iconName) : action.icon;
              const buttonContent = (
                <>
                  {Icon && <Icon className="mr-2 h-4 w-4 shrink-0" />}
                  {action.label}
                </>
              );

              if (action.href) {
                return (
                  <Button
                    key={action.id || action.label || index}
                    variant={action.variant || "default"}
                    size={action.size || "default"}
                    disabled={action.disabled}
                    asChild
                  >
                    <Link href={action.href}>{buttonContent}</Link>
                  </Button>
                );
              }

              return (
                <Button
                  key={action.id || action.label || index}
                  variant={action.variant || "default"}
                  size={action.size || "default"}
                  onClick={action.onClick}
                  disabled={action.disabled}
                >
                  {buttonContent}
                </Button>
              );
            })}
          </div>
        )}
      </div>

      {/* Custom children extension point */}
      {children}
    </div>
  );
}

export default PageHeader;

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

/**
 * 403 Forbidden View Component
 */
export function ForbiddenView({ allowedRoles = [], className }) {
  return (
    <div
      className={cn(
        "flex min-h-[400px] w-full flex-col items-center justify-center text-center p-6 bg-card rounded-xl border border-destructive/20 space-y-4",
        className
      )}
    >
      <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <ShieldAlert className="size-7 shrink-0" />
      </div>

      <div className="space-y-2 max-w-md">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          403 — Access Denied
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          You do not have the required permissions to view this resource.
          {allowedRoles.length > 0 && (
            <span className="block mt-1 text-xs">
              Allowed role(s):{" "}
              <span className="font-semibold text-foreground">
                {allowedRoles.join(", ")}
              </span>
            </span>
          )}
        </p>
      </div>

      <div className="pt-2">
        <Button asChild variant="outline">
          <Link href={ROUTES.DASHBOARD}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}

export default ForbiddenView;

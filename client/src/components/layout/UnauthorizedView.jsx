import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertCircle, LogIn } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

/**
 * 401 Unauthorized View Component
 */
export function UnauthorizedView({ className }) {
  return (
    <div
      className={cn(
        "flex min-h-[400px] w-full flex-col items-center justify-center text-center p-6 bg-card rounded-xl border border-border space-y-4",
        className
      )}
    >
      <div className="flex size-14 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
        <AlertCircle className="size-7 shrink-0" />
      </div>

      <div className="space-y-2 max-w-md">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          401 — Authentication Required
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Your session has expired or you are not signed in. Please log in to access this page.
        </p>
      </div>

      <div className="pt-2">
        <Button asChild className="font-semibold shadow">
          <Link href={ROUTES.LOGIN}>
            <LogIn className="mr-2 h-4 w-4" />
            Sign In Again
          </Link>
        </Button>
      </div>
    </div>
  );
}

export default UnauthorizedView;

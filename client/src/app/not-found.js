import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion, Home } from "lucide-react";
import { ROUTES } from "@/constants/routes";

export const metadata = {
  title: "404 Page Not Found",
};

export default function NotFoundPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 p-6 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="text-center max-w-md space-y-6 bg-card border border-border p-8 rounded-2xl shadow-lg">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mx-auto">
          <FileQuestion className="size-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
            404
          </h1>
          <h2 className="text-xl font-semibold text-foreground">
            Page Not Found
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The page you are looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="pt-2">
          <Button asChild className="w-full font-semibold shadow">
            <Link href={ROUTES.DASHBOARD}>
              <Home className="mr-2 h-4 w-4" />
              Return to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

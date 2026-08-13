/**
 * Auth Layout
 *
 * Route group: (auth) — the parentheses mean this segment is NOT
 * part of the URL. So /app/(auth)/login/page.js renders at /login.
 *
 * Design decisions:
 * - Full-height centered layout — draws all attention to the auth card
 * - Subtle gradient background — premium feel without distraction
 * - Brand wordmark at top — establishes trust before any interaction
 * - Children (login/register forms) slot into the white card area
 */

import Link from "next/link";

export const metadata = {
  title: {
    default: "Sign In",
    template: "%s | Margastra",
  },
};

export default function AuthLayout({ children }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 p-4 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Brand header */}
      <div className="mb-8 text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground hover:opacity-80 transition-opacity"
        >
          {/* Logomark — a simple geometric accent */}
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-black">
            M
          </span>
          Margastra
        </Link>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Your AI-powered career guidance platform
        </p>
      </div>

      {/* Auth card container — children (login/register) render here */}
      <div className="w-full max-w-[420px]">{children}</div>

      {/* Footer */}
      <p className="mt-8 text-center text-xs text-muted-foreground">
        By continuing, you agree to our{" "}
        <Link href="/terms" className="underline underline-offset-4 hover:text-foreground transition-colors">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground transition-colors">
          Privacy Policy
        </Link>
      </p>
    </div>
  );
}

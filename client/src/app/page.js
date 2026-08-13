/**
 * Home Page — /
 *
 * Public landing page. In Phase 1 this is a simple redirect hub.
 * In Phase 5+ this becomes the marketing landing page.
 *
 * For now: directs visitors to login or register.
 */

import Link from "next/link";

export const metadata = {
  title: "Margastra — AI-Powered Career Counseling",
};

export default function HomePage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 p-6 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Hero */}
      <div className="text-center max-w-2xl space-y-6">
        {/* Brand */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground text-lg font-black shadow-lg">
            M
          </span>
          <span className="text-3xl font-bold tracking-tight">Margastra</span>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-tight">
          Find Your Perfect{" "}
          <span className="text-primary">Career Path</span>
        </h1>

        <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
          Connect with expert career counselors, take AI-powered assessments,
          and build a personalized roadmap to your dream career.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
          <Link
            href="/register"
            id="home-get-started-button"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-8 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:opacity-90 hover:-translate-y-0.5 active:translate-y-0"
          >
            Get Started Free
          </Link>
          <Link
            href="/login"
            id="home-sign-in-button"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-background px-8 text-sm font-semibold transition-all hover:bg-accent hover:-translate-y-0.5 active:translate-y-0"
          >
            Sign In
          </Link>
        </div>

        {/* Trust signal */}
        <p className="text-xs text-muted-foreground">
          Trusted by 1,000+ students and 50+ certified counselors
        </p>
      </div>
    </div>
  );
}

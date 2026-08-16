"use client";

import { Button } from "@/components/ui/button";
import {
  MessagesSquare,
  ClipboardCheck,
  Mic,
  CheckCircle2,
  ArrowRight,
  Users,
  Loader2,
} from "lucide-react";

/**
 * InterviewLibraryView — aggregate stats for the Interviews section.
 * Mirrors the Assessment Library's card-based overview, but for the
 * interview module as a whole (one "instrument": the engagement workflow).
 */
export default function InterviewLibraryView({
  stats,
  roster,
  isLoading,
  onOpenRoster,
  onRefresh,
}) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] space-y-3">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground">Loading interview overview...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Aggregate stat cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={MessagesSquare}
          label="Engagements Started"
          value={stats.engagementsStarted ?? 0}
          color="text-primary"
          bgColor="bg-primary/10"
          hint="Students with an active interview engagement"
        />
        <StatCard
          icon={ClipboardCheck}
          label="Awaiting Approval"
          value={stats.sessionsAwaitingApproval ?? 0}
          color="text-amber-600 dark:text-amber-400"
          bgColor="bg-amber-500/10"
          hint="Question sets generated, not yet reviewed"
        />
        <StatCard
          icon={Mic}
          label="Sessions Recorded"
          value={stats.sessionsRecorded ?? 0}
          color="text-blue-600 dark:text-blue-400"
          bgColor="bg-blue-500/10"
          hint="Recordings captured, awaiting completion"
        />
        <StatCard
          icon={CheckCircle2}
          label="Sessions Completed"
          value={stats.sessionsCompleted ?? 0}
          color="text-emerald-600 dark:text-emerald-400"
          bgColor="bg-emerald-500/10"
          hint="Fully conducted and closed out"
        />
      </div>

      {/* ── Roster CTA card ──────────────────────────────────────────────── */}
      <div className="group relative flex flex-col rounded-xl border border-border/60 bg-card p-6 shadow-xs transition-all duration-200 hover:shadow-md">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="p-2.5 rounded-lg bg-primary/10 shrink-0">
              <Users className="size-5 text-primary" />
            </div>
            <div className="min-w-0 space-y-1">
              <h3 className="font-bold text-base">Student Interview Roster</h3>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
                Every student with an active interview engagement, with their
                session statuses at a glance. Drill into any student to continue
                the in-context workflow (generate, approve, conduct, record).
              </p>
            </div>
          </div>
          <span className="text-2xl font-bold tabular-nums shrink-0">
            {roster.length}
            <span className="text-xs font-normal text-muted-foreground ml-1">students</span>
          </span>
        </div>

        <div className="mt-4 pt-4 border-t border-border/50">
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-1.5 font-medium"
            onClick={onOpenRoster}
          >
            View Roster
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, bgColor, hint }) {
  return (
    <div
      title={hint}
      className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-xs hover:shadow-sm transition-shadow"
    >
      <div className={`p-2.5 rounded-lg ${bgColor}`}>
        <Icon className={`size-5 ${color}`} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold tracking-tight tabular-nums">{value}</p>
        <p className="text-xs text-muted-foreground truncate">{label}</p>
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ChevronRight,
  Search,
  Inbox,
  MessagesSquare,
  Loader2,
  ClipboardCheck,
  Mic,
  CheckCircle2,
  PlayCircle,
  FileQuestion,
} from "lucide-react";

const SESSION_STATUS_META = {
  not_started: { label: "Not Started", icon: FileQuestion, className: "bg-muted/50 text-muted-foreground border-border/60" },
  questions_generated: { label: "Awaiting Approval", icon: ClipboardCheck, className: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30" },
  approved: { label: "Approved", icon: CheckCircle2, className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30" },
  in_progress: { label: "In Progress", icon: PlayCircle, className: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30" },
  recorded: { label: "Recorded", icon: Mic, className: "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/30" },
  completed: { label: "Completed", icon: CheckCircle2, className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30" },
};

const STATUS_ORDER = {
  not_started: 0,
  questions_generated: 1,
  approved: 2,
  in_progress: 3,
  recorded: 4,
  completed: 5,
};

function studentInitials(name) {
  const parts = name.split(" ").filter(Boolean);
  const letters = parts.slice(0, 2).map((p) => p[0] || "");
  return letters.join("").toUpperCase() || "S";
}

/**
 * InterviewRosterView — every student with an active engagement, their
 * session counts by status, and a drill-in link to the student detail page.
 */
export default function InterviewRosterView({ roster, isLoading, onBack }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return roster;
    return roster.filter(
      (row) =>
        (row.studentName || "").toLowerCase().includes(term) ||
        (row.studentEmail || "").toLowerCase().includes(term)
    );
  }, [roster, search]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] space-y-3">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground">Loading interview roster...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
      >
        <Link href={ROUTES.DASHBOARD} className="hover:text-foreground transition-colors">
          Home
        </Link>
        <ChevronRight className="size-3.5 shrink-0" />
        <Link href={ROUTES.INTERVIEWS} className="hover:text-foreground transition-colors">
          Interviews
        </Link>
        <ChevronRight className="size-3.5 shrink-0" />
        <span className="font-semibold text-foreground">Roster</span>
      </nav>

      <div>
        <Button variant="ghost" size="sm" className="-ml-2 gap-1.5 text-muted-foreground" onClick={onBack}>
          <ArrowLeft className="size-4" />
          Back to Interview Library
        </Button>
      </div>

      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search students by name or email..."
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="p-12 text-center rounded-xl border border-dashed border-border/80 bg-muted/20 space-y-3">
          <Inbox className="size-10 text-muted-foreground mx-auto" />
          <h3 className="font-semibold text-base">
            {search.trim() ? "No Students Match" : "No Interview Engagements Yet"}
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {search.trim()
              ? `No students match "${search.trim()}" for interview engagements.`
              : "Start an interview engagement from a student's Interview tab to see it here."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((row) => {
            const counts = row.sessionCounts || {};
            const total = counts.total || 0;
            const orderedStatuses = Object.entries(SESSION_STATUS_META)
              .filter(([status]) => (counts[status] || 0) > 0)
              .sort((a, b) => STATUS_ORDER[a[0]] - STATUS_ORDER[b[0]]);

            return (
              <Link
                key={row.engagementId || row.studentId}
                href={ROUTES.STUDENT_DETAIL(row.studentId)}
                className="group flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-xs transition-all duration-200 hover:shadow-md hover:border-primary/40"
              >
                {/* Student identity */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                    {studentInitials(row.studentName)}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                      {row.studentName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {row.studentEmail || "No email on record"}
                    </p>
                  </div>
                </div>

                {/* Session status chips */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {total === 0 ? (
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">
                      No sessions yet
                    </Badge>
                  ) : (
                    orderedStatuses.map(([status, meta]) => (
                      <span
                        key={status}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${meta.className}`}
                      >
                        <meta.icon className="size-3" />
                        {counts[status]} {meta.label}
                      </span>
                    ))
                  )}
                  <ChevronRight className="size-4 text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

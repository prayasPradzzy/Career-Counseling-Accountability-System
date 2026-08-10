"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Brain,
  Compass,
  Scale,
  Lightbulb,
  Target,
  ClipboardList,
  Clock,
  ArrowRight,
  Layers,
  Loader2,
} from "lucide-react";
import {
  isNotStartedStatus,
  isCompletedStatus,
  formatDuration,
  resolveId,
} from "./AssignmentRow";

// ── Per-category presentation (icon + accent + display label) ────────────────
const CATEGORY_META = {
  personality: {
    icon: Brain,
    label: "Personality",
    iconClass: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    accentBorder: "hover:border-violet-400/60",
  },
  interest: {
    icon: Compass,
    label: "Interests",
    iconClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    accentBorder: "hover:border-emerald-400/60",
  },
  values: {
    icon: Scale,
    label: "Values",
    iconClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    accentBorder: "hover:border-amber-400/60",
  },
  intelligence: {
    icon: Lightbulb,
    label: "Intelligence",
    iconClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    accentBorder: "hover:border-blue-400/60",
  },
  aptitude: {
    icon: Target,
    label: "Aptitude",
    iconClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    accentBorder: "hover:border-rose-400/60",
  },
};

const DEFAULT_CATEGORY_META = {
  icon: ClipboardList,
  label: "Assessment",
  iconClass: "bg-primary/10 text-primary",
  accentBorder: "hover:border-primary/40",
};

export function getCategoryMeta(category) {
  return CATEGORY_META[category] || DEFAULT_CATEGORY_META;
}

// How long an in-progress session can sit before it counts as "stuck" (7 days)
const STUCK_IN_PROGRESS_MS = 7 * 24 * 60 * 60 * 1000;
// Proportion of not-started assignments that triggers a subtle "mostly not started" flag
const HIGH_NOT_STARTED_RATIO = 0.5;

/**
 * computeAssessmentStats — real aggregates for ONE assessment, computed from the
 * counselor assignment list (deduplicated per student × assessment by the API).
 * Returns counts plus derived flags used by both the library card and the roster.
 */
export function computeAssessmentStats(assignments, definitionId) {
  const scoped = assignments.filter((a) => resolveId(a) === String(definitionId));

  const notStarted = scoped.filter((a) => isNotStartedStatus(a.status)).length;
  const inProgress = scoped.filter((a) => a.status === "IN_PROGRESS").length;
  const completed = scoped.filter((a) => isCompletedStatus(a.status)).length;
  const retake = scoped.filter((a) => a.status === "REJECTED").length;
  const assigned = scoped.length;

  const completedTimes = scoped
    .filter((a) => isCompletedStatus(a.status) && a.sessionSummary?.timeSpentSeconds > 0)
    .map((a) => a.sessionSummary.timeSpentSeconds);
  const avgCompletionSeconds = completedTimes.length
    ? Math.round(completedTimes.reduce((sum, t) => sum + t, 0) / completedTimes.length)
    : null;

  // Subtle attention flags — informational, not alarmist
  const stuckInProgress = scoped.filter((a) => {
    if (a.status !== "IN_PROGRESS") return false;
    const startedAt = a.sessionSummary?.startedAt || a.startedAt;
    if (!startedAt) return false;
    return Date.now() - new Date(startedAt).getTime() > STUCK_IN_PROGRESS_MS;
  }).length;

  const highNotStarted = assigned > 0 && notStarted / assigned >= HIGH_NOT_STARTED_RATIO;

  return {
    assigned,
    notStarted,
    inProgress,
    completed,
    retake,
    avgCompletionSeconds,
    stuckInProgress,
    highNotStarted,
  };
}

/**
 * AssessmentLibraryView — primary "By Assessment" view.
 * One card per active AssessmentDefinition (dynamic — a fourth assessment
 * appears automatically with zero new UI code).
 */
export default function AssessmentLibraryView({
  definitions,
  assignments,
  isLoading,
  onOpenRoster,
}) {
  const statsByDefinition = useMemo(() => {
    const map = {};
    definitions.forEach((def) => {
      const defId = resolveId(def);
      map[defId] = computeAssessmentStats(assignments, defId);
    });
    return map;
  }, [definitions, assignments]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] space-y-3">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground">Loading assessment library...</p>
      </div>
    );
  }

  if (definitions.length === 0) {
    return (
      <div className="p-12 text-center rounded-xl border border-dashed border-border/80 bg-muted/20 space-y-3">
        <Layers className="size-10 text-muted-foreground mx-auto" />
        <h3 className="font-semibold text-base">No Assessments Available</h3>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          No active assessments exist in the catalog yet.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {definitions.map((def) => (
        <AssessmentLibraryCard
          key={resolveId(def)}
          definition={def}
          stats={statsByDefinition[resolveId(def)]}
          onOpen={() => onOpenRoster(def)}
        />
      ))}
    </div>
  );
}

/**
 * AssessmentLibraryCard — one assessment type with real aggregate stats.
 */
function AssessmentLibraryCard({ definition, stats, onOpen }) {
  const meta = getCategoryMeta(definition.category);
  const Icon = meta.icon;

  const itemsLabel = definition.questionCount
    ? `${definition.questionCount} items`
    : null;
  const durationLabel = definition.estimatedDuration
    ? `~${definition.estimatedDuration} min`
    : null;
  const metaParts = [meta.label, itemsLabel, durationLabel].filter(Boolean).join(" • ");

  const showRetake = (stats?.retake ?? 0) > 0;
  const showStuckFlag = (stats?.stuckInProgress ?? 0) > 0;

  return (
    <div
      className={`
        group relative flex flex-col rounded-xl border border-border/60 bg-card p-5
        shadow-xs transition-all duration-200 hover:shadow-md
        ${meta.accentBorder}
      `}
    >
      {/* Header: icon + title */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className={`p-2.5 rounded-lg shrink-0 ${meta.iconClass}`}>
            <Icon className="size-5" />
          </div>
          <div className="min-w-0 space-y-1">
            <h3 className="font-bold text-base leading-snug truncate">{definition.title}</h3>
            <p className="text-xs text-muted-foreground">{metaParts}</p>
          </div>
        </div>
      </div>

      {/* Real aggregate stats */}
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <StatChip label="Assigned" value={stats?.assigned ?? 0} />
        <StatChip
          label="In Progress"
          value={stats?.inProgress ?? 0}
          accent={showStuckFlag}
          title={
            showStuckFlag
              ? `${stats.stuckInProgress} session${stats.stuckInProgress === 1 ? "" : "s"} in progress for over a week`
              : undefined
          }
          dot={showStuckFlag}
        />
        <StatChip label="Completed" value={stats?.completed ?? 0} />
        <StatChip
          label="Not Started"
          value={stats?.notStarted ?? 0}
          accent={stats?.highNotStarted}
          title={
            stats?.highNotStarted
              ? "Most of this assessment's assignments haven't been started yet"
              : undefined
          }
        />
        {showRetake && (
          <StatChip label="Retake Requested" value={stats.retake} className="col-span-2" />
        )}
      </div>

      {/* Avg completion time */}
      <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Clock className="size-3.5" />
        <span>
          Avg. completion time:{" "}
          <span className="font-medium text-foreground">
            {stats?.avgCompletionSeconds ? formatDuration(stats.avgCompletionSeconds) : "—"}
          </span>
        </span>
      </div>

      {/* View Roster action */}
      <div className="mt-4 pt-4 border-t border-border/50">
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-1.5 font-medium"
          onClick={onOpen}
        >
          View Roster
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </Button>
      </div>
    </div>
  );
}

function StatChip({ label, value, accent = false, title, dot = false, className = "" }) {
  return (
    <div
      title={title}
      className={`flex items-center justify-between gap-2 rounded-lg border border-border/50 bg-muted/30 px-2.5 py-1.5 ${className}`}
    >
      <span className="text-muted-foreground font-medium">{label}</span>
      <span
        className={`font-bold tabular-nums flex items-center gap-1 ${
          accent ? "text-amber-600 dark:text-amber-400" : "text-foreground"
        }`}
      >
        {dot && (
          <span
            className="size-1.5 rounded-full bg-amber-500 animate-pulse"
            aria-hidden="true"
          />
        )}
        {value}
      </span>
    </div>
  );
}

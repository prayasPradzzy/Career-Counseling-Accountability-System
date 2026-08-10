"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  ChevronRight,
  Search,
  ArrowUpDown,
  Inbox,
  Clock,
  PlayCircle,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import { computeAssessmentStats, getCategoryMeta } from "./AssessmentLibraryView";
import AssignmentRow, {
  isNotStartedStatus,
  isCompletedStatus,
  STATUS_BADGE_MAP,
  resolveId,
} from "./AssignmentRow";

// Sort option values
const SORT_OPTIONS = [
  { value: "name", label: "Name" },
  { value: "status", label: "Status" },
  { value: "assigned", label: "Assigned Date" },
  { value: "progress", label: "Progress" },
];

// Stable sort key for status ordering
const STATUS_ORDER = {
  ASSIGNED: 0,
  SCHEDULED: 0,
  IN_PROGRESS: 1,
  COMPLETED: 2,
  UNDER_REVIEW: 2,
  APPROVED: 2,
  REJECTED: 3,
  EXPIRED: 4,
};

function studentName(assignment) {
  const s = assignment.studentId || {};
  return `${s.firstName || ""} ${s.lastName || s.name || ""}`.trim() || "Unknown Student";
}

function progressPercent(assignment) {
  const session = assignment.sessionSummary;
  if (isCompletedStatus(assignment.status)) return 100;
  if (assignment.status === "IN_PROGRESS") return session?.progress?.percentage ?? 0;
  return 0;
}

/**
 * AssessmentRosterView — drill-down roster scoped to a single assessment.
 * Search (by student name) and sort are client-side at current scale.
 */
export default function AssessmentRosterView({
  definition,
  assignments,
  onBack,
  onRetake,
  onViewDetail,
}) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name");

  const scopedAssignments = useMemo(
    () => assignments.filter((a) => resolveId(a) === resolveId(definition)),
    [assignments, definition]
  );

  const stats = useMemo(
    () => computeAssessmentStats(assignments, resolveId(definition)),
    [assignments, definition]
  );

  const filteredSorted = useMemo(() => {
    const term = search.trim().toLowerCase();
    let rows = scopedAssignments;
    if (term) {
      rows = rows.filter((a) => studentName(a).toLowerCase().includes(term));
    }

    const sorted = [...rows];
    switch (sortBy) {
      case "status":
        sorted.sort(
          (a, b) =>
            (STATUS_ORDER[a.status] ?? 5) - (STATUS_ORDER[b.status] ?? 5) ||
            studentName(a).localeCompare(studentName(b))
        );
        break;
      case "assigned":
        sorted.sort(
          (a, b) =>
            new Date(a.assignedAt || 0).getTime() - new Date(b.assignedAt || 0).getTime() ||
            studentName(a).localeCompare(studentName(b))
        );
        break;
      case "progress":
        sorted.sort(
          (a, b) =>
            progressPercent(a) - progressPercent(b) ||
            studentName(a).localeCompare(studentName(b))
        );
        break;
      case "name":
      default:
        sorted.sort((a, b) => studentName(a).localeCompare(studentName(b)));
        break;
    }
    return sorted;
  }, [scopedAssignments, search, sortBy]);

  const meta = getCategoryMeta(definition?.category);
  const itemsLabel = definition?.questionCount
    ? `${definition.questionCount} items`
    : null;
  const durationLabel = definition?.estimatedDuration
    ? `~${definition.estimatedDuration} min`
    : null;
  const metaParts = [meta.label, itemsLabel, durationLabel].filter(Boolean).join(" • ");

  const showRetake = stats.retake > 0;

  return (
    <div className="space-y-5">
      {/* Breadcrumb: Home > Assessments > {assessment} */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
      >
        <Link href={ROUTES.DASHBOARD} className="hover:text-foreground transition-colors">
          Home
        </Link>
        <ChevronRight className="size-3.5 shrink-0" />
        <Link href={ROUTES.ASSESSMENTS} className="hover:text-foreground transition-colors">
          Assessments
        </Link>
        <ChevronRight className="size-3.5 shrink-0" />
        <span className="font-semibold text-foreground truncate max-w-[240px]">
          {definition?.title}
        </span>
      </nav>

      {/* Back to library */}
      <div>
        <Button variant="ghost" size="sm" className="-ml-2 gap-1.5 text-muted-foreground" onClick={onBack}>
          <ArrowLeft className="size-4" />
          Back to Assessment Library
        </Button>
      </div>

      {/* Roster header */}
      <div className="rounded-xl border border-border/60 bg-card p-5 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight">{definition?.title}</h2>
            <p className="text-sm text-muted-foreground">{metaParts}</p>
            {definition?.description && (
              <p className="text-xs text-muted-foreground/80 leading-relaxed max-w-2xl">
                {definition.description}
              </p>
            )}
          </div>
          <div className="text-right shrink-0">
            <div className="text-2xl font-bold tabular-nums">{stats.assigned}</div>
            <div className="text-xs text-muted-foreground">students assigned</div>
          </div>
        </div>

        {/* Scoped status chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <RosterStatChip
            icon={Clock}
            label="Not Started"
            value={stats.notStarted}
            accent={stats.highNotStarted}
            title={stats.highNotStarted ? "Most assignments haven't been started yet" : undefined}
          />
          <RosterStatChip
            icon={PlayCircle}
            label="In Progress"
            value={stats.inProgress}
            accent={stats.stuckInProgress > 0}
            title={
              stats.stuckInProgress > 0
                ? `${stats.stuckInProgress} session${stats.stuckInProgress === 1 ? "" : "s"} in progress for over a week`
                : undefined
            }
          />
          <RosterStatChip icon={CheckCircle2} label="Completed" value={stats.completed} />
          {showRetake && (
            <RosterStatChip icon={RotateCcw} label="Retake Requested" value={stats.retake} />
          )}
        </div>
      </div>

      {/* Search + Sort */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search students by name..."
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <ArrowUpDown className="size-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">Sort:</span>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[170px] h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Rows */}
      {filteredSorted.length === 0 ? (
        <div className="p-12 text-center rounded-xl border border-dashed border-border/80 bg-muted/20 space-y-3">
          <Inbox className="size-10 text-muted-foreground mx-auto" />
          <h3 className="font-semibold text-base">
            {search.trim() ? "No Students Match" : "No Assignments Yet"}
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {search.trim()
              ? `No students match "${search.trim()}" for this assessment.`
              : "No students have been assigned this assessment yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSorted.map((assignment) => (
            <AssignmentRow
              key={assignment._id || assignment.id}
              assignment={assignment}
              onRetake={() => onRetake(assignment)}
              onViewDetail={() => onViewDetail(assignment)}
            />
          ))}
        </div>
      )}

      {/* Legend for effective statuses */}
      {filteredSorted.length > 0 && (
        <p className="text-[10px] text-muted-foreground/70 flex items-center gap-3 flex-wrap">
          {["ASSIGNED", "IN_PROGRESS", "COMPLETED", "REJECTED"].map((s) => {
            const info = STATUS_BADGE_MAP[s];
            return (
              <span key={s} className="flex items-center gap-1">
                <span
                  className={`size-2 rounded-full ${
                    s === "ASSIGNED"
                      ? "bg-muted-foreground/50"
                      : s === "IN_PROGRESS"
                      ? "bg-amber-500"
                      : s === "COMPLETED"
                      ? "bg-emerald-500"
                      : "bg-destructive"
                  }`}
                />
                {info.label}
              </span>
            );
          })}
        </p>
      )}
    </div>
  );
}

function RosterStatChip({ icon: Icon, label, value, accent = false, title }) {
  return (
    <div
      title={title}
      className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium ${
        accent
          ? "border-amber-400/50 bg-amber-500/10 text-amber-700 dark:text-amber-300"
          : "border-border/60 bg-muted/40 text-muted-foreground"
      }`}
    >
      <Icon className="size-3.5" />
      <span>{label}:</span>
      <span className="font-bold tabular-nums text-foreground">{value}</span>
    </div>
  );
}

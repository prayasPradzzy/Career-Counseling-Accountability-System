import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Eye,
  RotateCcw,
  User,
  CalendarDays,
  Timer,
} from "lucide-react";

// ── Status → badge variant mapping ───────────────────────────────────────────
export const STATUS_BADGE_MAP = {
  ASSIGNED: { variant: "secondary", label: "Not Started" },
  SCHEDULED: { variant: "secondary", label: "Scheduled" },
  IN_PROGRESS: { variant: "amber", label: "In Progress" },
  COMPLETED: { variant: "emerald", label: "Completed" },
  // Legacy statuses that may still exist in DB — map gracefully
  UNDER_REVIEW: { variant: "emerald", label: "Completed" },
  APPROVED: { variant: "emerald", label: "Completed" },
  REJECTED: { variant: "destructive", label: "Retake Requested" },
  EXPIRED: { variant: "secondary", label: "Expired" },
};

// ── Status groups (shared by library aggregation + roster + all-activity) ───
export const NOT_STARTED_STATUSES = ["ASSIGNED", "SCHEDULED"];
export const COMPLETED_STATUSES = ["COMPLETED", "UNDER_REVIEW", "APPROVED"];

export function isNotStartedStatus(status) {
  return NOT_STARTED_STATUSES.includes(status);
}

export function isCompletedStatus(status) {
  return COMPLETED_STATUSES.includes(status);
}

export function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDuration(seconds) {
  if (!seconds) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins < 1) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

/**
 * resolveId — API responses serialize `_id` as `id` (mongoose transform), while
 * lean endpoints (e.g. assessment definitions) still send `_id`. Resolve either.
 * Accepts an entity, or an object with an assessmentDefinitionId nested field.
 */
export function resolveId(entityOrWithDef) {
  const entity = entityOrWithDef?.assessmentDefinitionId || entityOrWithDef || {};
  return String(entity.id || entity._id || "");
}

/**
 * AssignmentRow — one student × assessment row in a roster list.
 * Reused by the "All Activity" view and the per-assessment roster.
 */
export default function AssignmentRow({ assignment, onRetake, onViewDetail }) {
  const def = assignment.assessmentDefinitionId || {};
  const student = assignment.studentId || {};
  const session = assignment.sessionSummary;
  const statusInfo =
    STATUS_BADGE_MAP[assignment.status] || { variant: "secondary", label: assignment.status };

  const isCompleted = isCompletedStatus(assignment.status);
  const isInProgress = assignment.status === "IN_PROGRESS";
  const hasSession = isCompleted || isInProgress;

  // Progress: completed = always 100%, in-progress = session value, else 0
  const progressPercent = isCompleted
    ? 100
    : isInProgress
    ? session?.progress?.percentage ?? 0
    : 0;

  return (
    <div className="group rounded-xl border border-border/60 bg-card hover:border-primary/30 hover:shadow-sm transition-all duration-200 overflow-hidden">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4 p-4">
        {/* Student + Assessment Info */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
            <User className="size-4" />
          </div>
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold text-sm truncate">
                {student.firstName || ""} {student.lastName || student.name || ""}
              </h4>
              <Badge variant={statusInfo.variant} className="text-[10px] px-1.5 py-0 shrink-0">
                {statusInfo.label}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {def.title || "Assessment"} • {def.category || assignment.category || "—"}
            </p>
          </div>
        </div>

        {/* Progress + Timing + Actions */}
        <div className="flex items-center gap-6 shrink-0">
          {/* Progress Bar */}
          <div className="hidden sm:flex flex-col items-end gap-1 min-w-[100px]">
            <span className="text-[10px] font-medium text-muted-foreground">
              {Math.round(progressPercent)}% Complete
            </span>
            <Progress value={progressPercent} className="w-24 h-1.5" />
          </div>

          {/* Timing Meta */}
          <div className="hidden md:flex flex-col items-end gap-0.5 text-[10px] text-muted-foreground min-w-[120px]">
            {session?.submittedAt ? (
              <span className="flex items-center gap-1">
                <CalendarDays className="size-3" />
                {formatDate(session.submittedAt)}
              </span>
            ) : assignment.assignedAt ? (
              <span className="flex items-center gap-1">
                <CalendarDays className="size-3" />
                Assigned {formatDate(assignment.assignedAt)}
              </span>
            ) : null}
            {session?.timeSpentSeconds > 0 && (
              <span className="flex items-center gap-1">
                <Timer className="size-3" />
                {formatDuration(session.timeSpentSeconds)}
              </span>
            )}
          </div>

          {/* Action Buttons — only View and Retake */}
          <div className="flex items-center gap-1.5">
            {hasSession && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={onViewDetail}
              >
                <Eye className="size-3" />
                <span className="hidden sm:inline">View</span>
              </Button>
            )}
            {isCompleted && (
              <Button
                variant="destructive"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={onRetake}
              >
                <RotateCcw className="size-3" />
                <span className="hidden sm:inline">Retake</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { SectionCard } from "@/components/common/SectionCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyIllustration } from "@/components/common/EmptyIllustration";
import {
  BookOpen,
  Clock,
  CheckCircle2,
  Play,
  CalendarDays,
  Timer,
  Eye,
  Loader2,
} from "lucide-react";

/**
 * AssessmentHistorySection
 * Single consolidated per-assessment view for student detail page.
 * Displays all assigned assessments with unified status, progress bar, and action buttons.
 * No separate bottom scores registry — results live directly inside each assessment card.
 */
export function AssessmentHistorySection({ assignments = [], onAssignAssessment }) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <SectionCard
        title="Assigned Career Assessments"
        subtitle="Psychometric, interest, and aptitude assessment suite"
        iconName="BookOpen"
        action={
          onAssignAssessment && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1.5"
              onClick={onAssignAssessment}
            >
              <BookOpen className="size-3.5" />
              Assign Assessment
            </Button>
          )
        }
      >
        <div className="space-y-3 pt-2">
          {assignments.length === 0 ? (
            <EmptyIllustration
              iconName="BookOpen"
              title="No Assessments Assigned"
              description="No assessments have been assigned to this student yet. Click 'Assign Assessment' to get started."
              className="p-6 sm:p-8"
            />
          ) : (
            assignments.map((item, idx) => {
              const definition = item.assessmentDefinitionId || {};
              const title = definition.title || "Career Assessment";
              const category = definition.category || item.category || "General";
              const estimatedDuration = definition.estimatedDuration || 20;

              const assignedDate = item.assignedAt
                ? new Date(item.assignedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "—";

              const dueDate = item.dueDate
                ? new Date(item.dueDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : null;

              // SINGLE SOURCE OF TRUTH: Derive completion & progress percentage
              const isCompleted =
                item.status === "COMPLETED" ||
                item.status === "submitted" ||
                item.status === "completed" ||
                item.status === "APPROVED" ||
                item.status === "UNDER_REVIEW";

              const isInProgress = item.status === "IN_PROGRESS" || item.status === "in_progress";

              let progress = 0;
              if (isCompleted) {
                progress = 100;
              } else if (isInProgress) {
                progress = item.sessionSummary?.progress?.percentage || item.progressPercentage || 50;
              }

              const hasScore = Boolean(item.hasScore || item.sessionSummary?.hasScore);
              const assignmentId = item._id || item.id;

              return (
                <div
                  key={assignmentId || idx}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-border bg-card hover:bg-muted/20 transition-colors gap-4"
                >
                  <div className="space-y-2 flex-1 min-w-0">
                    {/* Header: Title & Category */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-sm text-foreground">{title}</h4>
                      <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider py-0.5">
                        {category}
                      </Badge>
                    </div>

                    {/* Metadata Row */}
                    <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="size-3.5" />
                        Assigned {assignedDate}
                      </span>
                      {dueDate && (
                        <span className="flex items-center gap-1">
                          <Clock className="size-3.5" />
                          Due {dueDate}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Timer className="size-3.5" />
                        ~{estimatedDuration} min
                      </span>
                    </div>

                    {/* Single-Sourced Progress Bar */}
                    <div className="flex items-center gap-2 pt-0.5">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-[220px]">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isCompleted ? "bg-emerald-600 dark:bg-emerald-500" : "bg-primary"
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span
                        className={`text-[11px] font-mono font-medium ${
                          isCompleted ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-muted-foreground"
                        }`}
                      >
                        {progress}%
                      </span>
                    </div>

                    {/* Counselor Notes if present */}
                    {item.counselorNotes && (
                      <p className="text-[11px] text-muted-foreground italic truncate">
                        &ldquo;{item.counselorNotes}&rdquo;
                      </p>
                    )}
                  </div>

                  {/* Actions & Status Badge Block */}
                  <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge status={isCompleted ? "COMPLETED" : isInProgress ? "IN_PROGRESS" : "ASSIGNED"} />

                    {isCompleted ? (
                      hasScore ? (
                        <Button
                          size="sm"
                          className="text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                          onClick={() => router.push(`/assessments/review/${assignmentId}`)}
                        >
                          <Eye className="size-3.5" />
                          View Results
                        </Button>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
                          <Loader2 className="size-3.5 animate-spin text-amber-500" />
                          <span>Scoring in progress</span>
                        </div>
                      )
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </SectionCard>
    </div>
  );
}

export default AssessmentHistorySection;

"use client";

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
  Lock,
  UserCheck,
  ShieldCheck,
  CalendarDays,
  Timer,
} from "lucide-react";

/**
 * AssessmentHistorySection
 * Displays the counselor-assigned assessment suite for a student.
 * All data comes from real backend API. Zero mock data.
 *
 * Assessment cards display: Title, Category, Assigned Date, Due Date,
 * Status, Progress, Estimated Time.
 */
export function AssessmentHistorySection({ assignments = [], onAssignAssessment }) {
  return (
    <div className="space-y-6">
      <SectionCard
        title="Counselor-Assigned Assessment Suite"
        subtitle="Assigned psychometric and career assessments"
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
              const category = definition.category || item.category || "—";
              const estimatedDuration = definition.estimatedDuration || 20;
              const counselor = item.counselorId || {};
              const counselorName = counselor.firstName
                ? `${counselor.firstName} ${counselor.lastName || ""}`.trim()
                : "Counselor";

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

              // Compute progress percentage based on status
              const statusProgressMap = {
                SCHEDULED: 0,
                ASSIGNED: 0,
                IN_PROGRESS: 50,
                COMPLETED: 80,
                UNDER_REVIEW: 85,
                APPROVED: 100,
                REJECTED: 0,
                EXPIRED: 0,
              };
              const progress = statusProgressMap[item.status] ?? 0;

              return (
                <div
                  key={item._id || item.id || idx}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-muted/20 transition-colors gap-3"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    {/* Title & Category */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-sm text-foreground">{title}</h4>
                      <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                        {category}
                      </Badge>
                    </div>

                    {/* Metadata Row: Assigned Date, Due Date, Estimated Time */}
                    <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="size-3" />
                        Assigned {assignedDate}
                      </span>
                      {dueDate && (
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          Due {dueDate}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Timer className="size-3" />
                        ~{estimatedDuration} min
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="flex items-center gap-2 pt-0.5">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-[200px]">
                        <div
                          className="h-full rounded-full transition-all duration-500 bg-primary"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground font-medium">{progress}%</span>
                    </div>

                    {/* Counselor Notes */}
                    {item.counselorNotes && (
                      <p className="text-[11px] text-muted-foreground italic truncate">
                        &ldquo;{item.counselorNotes}&rdquo;
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge status={item.status} />

                    {item.status === "APPROVED" ? (
                      <Button variant="outline" size="sm" className="text-xs gap-1.5 text-emerald-600 border-emerald-600/30" disabled>
                        <ShieldCheck className="size-3.5" />
                        Approved
                      </Button>
                    ) : item.status === "COMPLETED" || item.status === "UNDER_REVIEW" ? (
                      <Button variant="secondary" size="sm" className="text-xs gap-1.5" disabled>
                        <UserCheck className="size-3.5" />
                        Awaiting Review
                      </Button>
                    ) : item.status === "REJECTED" ? (
                      <Button variant="outline" size="sm" className="text-xs gap-1.5 text-red-600 border-red-600/30" disabled>
                        Retake Required
                      </Button>
                    ) : (
                      <Button size="sm" className="text-xs gap-1.5" disabled>
                        <Play className="size-3.5" />
                        {item.status === "IN_PROGRESS" ? "In Progress" : "Pending Start"}
                      </Button>
                    )}
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

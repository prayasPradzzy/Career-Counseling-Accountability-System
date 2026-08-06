"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useMyAssignments } from "@/features/assessments/hooks/useAssessmentAssignments";
import { useStartOrResumeSession, useActiveSession } from "@/features/assessments/hooks/useAssessmentSession";
import { StudentAssessmentRunner, CounselorAssessmentDashboard } from "@/features/assessments";
import { PageHeader } from "@/components/layout/PageHeader";
import { WidgetGrid } from "@/components/layout/WidgetGrid";
import { SectionCard } from "@/components/common/SectionCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Clock,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Play,
  CalendarDays,
  Timer,
} from "lucide-react";
import { toast } from "sonner";

export default function AssessmentsPage() {
  const { user } = useAuth();
  const [activeSessionId, setActiveSessionId] = useState(null);

  const isCounselorOrAdmin = user?.role === "counselor" || user?.role === "admin";

  const { data: assignmentsData, isLoading, refetch } = useMyAssignments();
  const { data: activeSessionData } = useActiveSession();

  const startSessionMutation = useStartOrResumeSession();

  // If user is Counselor or Admin, render the Counselor Review Dashboard
  if (isCounselorOrAdmin) {
    return <CounselorAssessmentDashboard />;
  }

  const assignments = assignmentsData?.data?.assignments || [];
  const activeSessionPayload = activeSessionData?.data?.activeSession;
  const existingActiveSession = activeSessionPayload?.session || activeSessionPayload;

  const handleStartOrResume = async (assignmentId) => {
    try {
      const res = await startSessionMutation.mutateAsync(assignmentId);
      const session = res?.data?.session || res?.session;
      const targetSessionId = session?._id || session?.id;
      if (targetSessionId) {
        setActiveSessionId(targetSessionId);
      } else {
        toast.error("Failed to start session. Please try again.");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Unable to start assessment.");
    }
  };

  // If a session is active in the runner, display the StudentAssessmentRunner component
  if (activeSessionId) {
    return (
      <StudentAssessmentRunner
        sessionId={activeSessionId}
        onBack={() => {
          setActiveSessionId(null);
          refetch();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Career Assessments"
        subtitle="Take assigned psychometric, interest, and values assessments to build your comprehensive guidance profile."
      />

      {/* Active In-Progress Banner if student has a session in progress */}
      {existingActiveSession && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-600">
              <Clock className="size-5" />
            </div>
            <div>
              <h4 className="font-semibold text-sm">Assessment in Progress</h4>
              <p className="text-xs text-muted-foreground">
                You have an active session in progress ({existingActiveSession.progress?.percentage || 0}% answered). Continue right where you left off.
              </p>
            </div>
          </div>

          <Button
            className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow shrink-0"
            onClick={() => setActiveSessionId(existingActiveSession._id || existingActiveSession.id)}
          >
            Resume Session <Play className="ml-1.5 size-3.5" />
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] space-y-3">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">Loading your assigned assessments...</p>
        </div>
      ) : assignments.length === 0 ? (
        /* Empty State */
        <div className="p-12 text-center rounded-xl border border-dashed border-border/80 bg-muted/20 space-y-3">
          <BookOpen className="size-10 text-muted-foreground mx-auto" />
          <h3 className="font-semibold text-base">No Assessments Assigned Yet</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Your assigned counselor will unlock assessments for you as part of your guidance roadmap.
          </p>
        </div>
      ) : (
        /* Assigned Assessments Grid — Enhanced Cards */
        <WidgetGrid cols={{ default: 1, md: 2 }} gap="gap-6">
          {assignments.map((item) => {
            const def = item.assessmentDefinitionId || {};
            const isCompleted = item.status === "COMPLETED" || item.status === "APPROVED" || item.status === "UNDER_REVIEW";
            const isInProgress = item.status === "IN_PROGRESS";

            let progress = 0;
            if (isCompleted) {
              progress = 100;
            } else if (isInProgress) {
              progress = existingActiveSession?.progress?.percentage || item.progressPercentage || 0;
            }

            const assignedDate = item.assignedAt
              ? new Date(item.assignedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "—";

            return (
              <SectionCard
                key={item._id || item.id}
                title={def.title || "Career Assessment"}
                subtitle={`${def.category || item.category || "General"} Category`}
                iconName="BookOpen"
                action={
                  <StatusBadge status={item.status} />
                }
                footer={
                  <Button
                    className="w-full font-semibold shadow"
                    disabled={isCompleted || startSessionMutation.isPending}
                    variant={isCompleted ? "outline" : isInProgress ? "secondary" : "default"}
                    onClick={() => handleStartOrResume(item._id || item.id)}
                  >
                    {isCompleted ? (
                      <>
                        <CheckCircle2 className="mr-2 size-4 text-emerald-600" />
                        Completed & Submitted
                      </>
                    ) : isInProgress ? (
                      <>
                        <Play className="mr-2 size-4 text-amber-600" />
                        Resume Assessment
                      </>
                    ) : (
                      <>
                        <BookOpen className="mr-2 size-4" />
                        Start Assessment
                      </>
                    )}
                  </Button>
                }
              >
                <div className="space-y-4 pt-1">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {def.description || "Take this assessment to build your guidance profile."}
                  </p>

                  {/* Student View Completion Confirmation Block */}
                  {isCompleted ? (
                    <div className="p-3.5 rounded-lg bg-muted/40 border border-border/60 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-semibold text-foreground">
                        <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Assessment Completed</span>
                      </div>
                      <p className="text-muted-foreground leading-relaxed">
                        You've completed your Personality Assessment. Your counselor will go over your results with you and use them to help guide your career conversations.
                      </p>
                    </div>
                  ) : (
                    /* Progress Bar for In-Progress */
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500 bg-primary"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground font-medium w-8 text-right">{progress}%</span>
                    </div>
                  )}

                  {/* Metadata Row: Assigned Date, Due Date, Estimated Time */}
                  <div className="flex items-center gap-4 flex-wrap text-xs text-muted-foreground pt-2 border-t border-border/60">
                    <div className="flex items-center gap-1.5">
                      <CalendarDays className="size-3.5" />
                      <span>Assigned {assignedDate}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Timer className="size-3.5" />
                      <span>{def.estimatedDuration || 20} mins</span>
                    </div>
                    {item.dueDate && (
                      <div className="flex items-center gap-1.5">
                        <AlertCircle className="size-3.5" />
                        <span>
                          Due: {new Date(item.dueDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </SectionCard>
            );
          })}
        </WidgetGrid>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useInterviewsOverview } from "@/features/interviews/hooks/useInterviews";
import InterviewLibraryView from "@/features/interviews/components/InterviewLibraryView";
import InterviewRosterView from "@/features/interviews/components/InterviewRosterView";
import { PageHeader } from "@/components/layout/PageHeader";

/**
 * Interviews — top-level counselor section (side by side with Assessments).
 *
 * Library view: cross-caseload aggregate stats for the interview module.
 * Roster view: every student with an active engagement + their session
 * statuses, drilling into the student's detail page (where the per-student
 * Interview tab lives for in-context work).
 */
export default function InterviewsPage() {
  const [view, setView] = useState("library");
  const { data, isLoading, refetch } = useInterviewsOverview();

  const stats = data?.data?.stats || {
    engagementsStarted: 0,
    sessionsAwaitingApproval: 0,
    sessionsRecorded: 0,
    sessionsCompleted: 0,
  };
  const roster = data?.data?.roster || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Interviews"
        subtitle="AI-assisted interview engagements across your caseload — question sets, approvals, and recorded sessions."
        breadcrumbs={false}
      />

      {view === "roster" ? (
        <InterviewRosterView
          roster={roster}
          isLoading={isLoading}
          onBack={() => setView("library")}
        />
      ) : (
        <InterviewLibraryView
          stats={stats}
          roster={roster}
          isLoading={isLoading}
          onOpenRoster={() => setView("roster")}
          onRefresh={refetch}
        />
      )}
    </div>
  );
}

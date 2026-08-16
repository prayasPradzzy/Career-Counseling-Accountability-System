"use client";

import { useState } from "react";
import { toast } from "sonner";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSkeleton } from "@/components/layout/LoadingSkeleton";
import { CheckCircle2, ClipboardCheck, Loader2, Plus } from "lucide-react";

import { EngagementStarter } from "./EngagementStarter";
import { SessionTypeSelector } from "./SessionTypeSelector";
import { QuestionSetGenerator } from "./QuestionSetGenerator";
import { ClusterQuestionCard } from "./ClusterQuestionCard";
import { InterviewSessionConductor } from "./InterviewSessionConductor";

import {
  useInterviewEngagement,
  useStartInterviewEngagement,
  useCreateInterviewSession,
  useGenerateInterviewQuestions,
  useInterviewQuestionSet,
  useApproveInterviewQuestions,
} from "../hooks/useInterviews";
import { INTERVIEW_CLUSTERS } from "../clusters";

const SESSION_TYPE_LABELS = {
  candidate: "Candidate Session",
  professional_self: "Professional Session",
};

const PRIORITY_RANK = { high: 0, medium: 1, light: 2 };

/**
 * Defensive render prep: one card per cluster, sorted High → Medium →
 * Light, regardless of what the API returns. If a cluster ever comes
 * back twice (a failure mode with LLM output), the entries are merged
 * into one authoritative card — questions unioned, higher priority kept.
 */
function dedupeAndSortClusters(list) {
  const byCluster = new Map();
  for (const entry of list || []) {
    if (!entry || !entry.cluster) continue;
    const existing = byCluster.get(entry.cluster);
    if (!existing) {
      byCluster.set(entry.cluster, { ...entry, questions: [...(entry.questions || [])] });
      continue;
    }
    const keepHigher =
      (PRIORITY_RANK[entry.priority] ?? 2) < (PRIORITY_RANK[existing.priority] ?? 2);
    const merged = {
      ...existing,
      priority: keepHigher ? entry.priority : existing.priority,
      questions: [...new Set([...(existing.questions || []), ...(entry.questions || [])])],
      rationale: existing.rationale || entry.rationale || "",
    };
    byCluster.set(entry.cluster, merged);
  }
  return [...byCluster.values()].sort(
    (a, b) => (PRIORITY_RANK[a.priority] ?? 2) - (PRIORITY_RANK[b.priority] ?? 2)
  );
}

/**
 * InterviewTab — the counselor's AI-assisted interview workflow for
 * one student. Start an engagement → pick a session type → generate
 * a cluster-organized question set grounded in the student's scores
 * → edit → explicitly approve.
 */
export function InterviewTab({ studentId, audioConsentGiven = false }) {
  const { data, isLoading } = useInterviewEngagement(studentId);
  const engagement = data?.data?.engagement || null;
  const completedAssessmentCount = data?.data?.completedAssessmentCount ?? 0;
  const sessions = data?.data?.sessions || [];

  const [sessionType, setSessionType] = useState("candidate");
  // A session just created in this component takes precedence; otherwise
  // fall back to the most recent session (restores state on reload).
  const [explicitSessionId, setExplicitSessionId] = useState(null);
  const sessionId = explicitSessionId || sessions[0]?.id || sessions[0]?._id || null;
  // The full session doc for the currently selected session
  const currentSession =
    sessions.find((s) => (s.id || s._id) === sessionId) || sessions[0] || null;

  // User edits to question text, keyed to the question set they belong to
  const [edits, setEdits] = useState({ setId: null, values: {} });

  const startMutation = useStartInterviewEngagement();
  const createSessionMutation = useCreateInterviewSession();
  const generateMutation = useGenerateInterviewQuestions();
  const approveMutation = useApproveInterviewQuestions();

  const { data: qsData, isLoading: qsLoading, error: qsError } =
    useInterviewQuestionSet(sessionId);
  const questionSet = qsData?.data?.questionSet || null;
  const isApproved = questionSet?.reviewedByCounselor === true;

  const editsAreForCurrentSet = edits.setId === questionSet?.id;

  /** Questions to display for a cluster (edits if current set, else original). */
  const baseQuestions = (cluster) =>
    editsAreForCurrentSet && edits.values[cluster.cluster]
      ? edits.values[cluster.cluster]
      : cluster.questions;

  /** Apply an updater fn to a cluster's question list, tagged to the current set. */
  const updateEdit = (cluster, updater) => {
    setEdits((prev) => {
      const fresh = prev.setId !== questionSet?.id;
      const values = fresh ? {} : { ...prev.values };
      const current = fresh
        ? [...cluster.questions]
        : [...(prev.values[cluster.cluster] || cluster.questions)];
      values[cluster.cluster] = updater(current);
      return { setId: questionSet?.id, values };
    });
  };

  const handleStart = () => {
    startMutation.mutate(studentId, {
      onSuccess: () => toast.success("Interview engagement started."),
      onError: (err) => toast.error(err?.message || "Failed to start interview engagement."),
    });
  };

  const handleCreateSession = () => {
    const engagementId = engagement?.id || engagement?._id;
    createSessionMutation.mutate(
      { engagementId, sessionType },
      {
        onSuccess: (res) => {
          const session = res?.data?.session;
          if (!session) return;
          setExplicitSessionId(session.id || session._id);
          toast.success("Interview session created.");
        },
        onError: (err) => toast.error(err?.message || "Failed to create interview session."),
      }
    );
  };

  const handleGenerate = () => {
    generateMutation.mutate(sessionId, {
      onSuccess: (res) => {
        toast.success(
          res?.data?.source === "fallback"
            ? "Questions generated (local fallback — no AI key configured)."
            : "Interview questions generated."
        );
      },
      onError: (err) => toast.error(err?.message || "Failed to generate questions."),
    });
  };

  const handleApprove = () => {
    const questionsByCluster = (questionSet.questionsByCluster || []).map((c) => ({
      cluster: c.cluster,
      priority: c.priority,
      questions: baseQuestions(c),
      rationale: c.rationale,
    }));

    approveMutation.mutate(
      {
        sessionId,
        payload: { questionsByCluster, reviewedByCounselor: true },
      },
      {
        onSuccess: () => toast.success("Question set approved and locked in."),
        onError: (err) => toast.error(err?.message || "Failed to approve question set."),
      }
    );
  };

  /* ── Loading state ── */
  if (isLoading) {
    return <LoadingSkeleton cards={2} />;
  }

  /* ── No engagement yet ── */
  if (!engagement) {
    return (
      <SectionCard
        title="Interview Process"
        subtitle="AI-assisted interview question generation grounded in assessment scores"
        iconName="MessageSquare"
      >
        <EngagementStarter onStart={handleStart} isStarting={startMutation.isPending} />
      </SectionCard>
    );
  }

  const sessionTypeLabel = SESSION_TYPE_LABELS[sessionType] || "Interview Session";

  return (
    <div className="space-y-6">
      {/* Session type + creation */}
      <SectionCard
        title="New Interview Session"
        subtitle="Choose who this interview is with — duration is set automatically"
        iconName="MessageSquare"
      >
        <SessionTypeSelector value={sessionType} onChange={setSessionType} />
        <div className="pt-3">
          <Button
            onClick={handleCreateSession}
            disabled={createSessionMutation.isPending}
            className="gap-1.5 text-xs font-semibold"
          >
            {createSessionMutation.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Plus className="size-3.5" />
            )}
            Create {sessionTypeLabel}
          </Button>
        </div>
      </SectionCard>

      {/* Generation / question set area */}
      {questionSet ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[11px] gap-1">
                {sessionTypeLabel}
              </Badge>
              {isApproved ? (
                <Badge className="text-[11px] gap-1 bg-emerald-500/10 text-emerald-600 border-emerald-600/30">
                  <CheckCircle2 className="size-3" />
                  Approved
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[11px] gap-1">
                  Draft — awaiting counselor approval
                </Badge>
              )}
            </div>
            {!isApproved && (
              <Button
                onClick={handleApprove}
                disabled={approveMutation.isPending}
                className="gap-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {approveMutation.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <ClipboardCheck className="size-3.5" />
                )}
                Approve Question Set
              </Button>
            )}
          </div>

          <div className="grid gap-3">
            {dedupeAndSortClusters(questionSet.questionsByCluster).map((cluster) => (
              <ClusterQuestionCard
                key={cluster.cluster}
                clusterName={INTERVIEW_CLUSTERS[cluster.cluster] || cluster.cluster}
                priority={cluster.priority}
                rationale={cluster.rationale}
                questions={baseQuestions(cluster)}
                readOnly={isApproved}
                onChange={(idx, value) =>
                  updateEdit(cluster, (list) => {
                    list[idx] = value;
                    return list;
                  })
                }
                onRemoveQuestion={(idx) =>
                  updateEdit(cluster, (list) => list.filter((_, i) => i !== idx))
                }
                onAddQuestion={() => updateEdit(cluster, (list) => [...list, ""])}
              />
            ))}
          </div>

          {/* Phase 2: conduct + record the approved session */}
          {isApproved && currentSession && (
            <InterviewSessionConductor
              session={currentSession}
              audioConsentGiven={audioConsentGiven}
              sessionTypeLabel={sessionTypeLabel}
            />
          )}
        </div>
      ) : qsLoading ? (
        <LoadingSkeleton cards={2} />
      ) : qsError ? (
        <QuestionSetGenerator
          sessionTypeLabel={sessionTypeLabel}
          completedAssessmentCount={completedAssessmentCount}
          isGenerating={generateMutation.isPending}
          onGenerate={handleGenerate}
        />
      ) : null}
    </div>
  );
}

export default InterviewTab;

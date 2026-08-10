"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  useAssignmentReviewDetail,
  useRejectAssignment,
  useRescoreAssignment,
} from "@/features/assessments/hooks/useAssessmentAssignments";
import { PageHeader } from "@/components/layout/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import DomainScoreCard from "./DomainScoreCard";
import FacetScoreRow from "./FacetScoreRow";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Clock,
  Loader2,
  RotateCcw,
  User,
  Calendar,
  Timer,
  BarChart2,
  Layers,
  FileText,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  History,
} from "lucide-react";
import { toast } from "sonner";

// ── Status badge map ──────────────────────────────────────────────────────────
const STATUS_BADGE_MAP = {
  ASSIGNED: { variant: "secondary", label: "Not Started" },
  SCHEDULED: { variant: "secondary", label: "Scheduled" },
  IN_PROGRESS: { variant: "amber", label: "In Progress" },
  COMPLETED: { variant: "emerald", label: "Completed" },
  UNDER_REVIEW: { variant: "emerald", label: "Completed" },
  APPROVED: { variant: "emerald", label: "Completed" },
  REJECTED: { variant: "destructive", label: "Retake Requested" },
  EXPIRED: { variant: "secondary", label: "Expired" },
};

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(seconds) {
  if (!seconds) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins < 1) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

export default function CounselorAssessmentReviewDetail({ assignmentId }) {
  const router = useRouter();
  const { data, isLoading, error, refetch } = useAssignmentReviewDetail(assignmentId);

  const [retakeDialog, setRetakeDialog] = useState(false);
  const [retakeNotes, setRetakeNotes] = useState("");
  const [responseFilter, setResponseFilter] = useState("all");
  const [showPrevAttempts, setShowPrevAttempts] = useState(false);

  const rejectMutation = useRejectAssignment();
  const rescoreMutation = useRescoreAssignment();

  // ── Guard: missing ID ─────────────────────────────────────────────────────
  if (!assignmentId || assignmentId === "undefined") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <AlertCircle className="size-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground font-medium">
          No assignment ID provided.
        </p>
        <button
          onClick={() => router.push("/assessments")}
          className="text-xs text-primary underline"
        >
          Back to Assessments
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <Loader2 className="size-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-medium">
          Loading assessment result data...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <AlertCircle className="size-10 text-destructive" />
        <p className="text-sm font-medium">Failed to load assessment result data.</p>
        <p className="text-xs text-muted-foreground">
          {error?.response?.data?.message || "Please try again or go back."}
        </p>
        <button
          onClick={() => router.push("/assessments")}
          className="text-xs text-primary underline"
        >
          Back to Assessments
        </button>
      </div>
    );
  }

  // ── Unpack data ────────────────────────────────────────────────────────────
  const reviewData = data?.data || {};
  const assignment = reviewData.assignment || {};
  const session = reviewData.session || {};
  const score = reviewData.score || null;
  const rawResponses = reviewData.rawResponses || [];
  const previousAttempts = reviewData.previousAttempts || [];

  const def = assignment.assessmentDefinitionId || {};
  const student = assignment.studentId || {};
  const statusInfo = STATUS_BADGE_MAP[assignment.status] || {
    variant: "secondary",
    label: assignment.status,
  };

  // ── Data-wiring fixes ──────────────────────────────────────────────────────
  const isCompleted =
    assignment.status === "COMPLETED" ||
    assignment.status === "UNDER_REVIEW" ||
    assignment.status === "APPROVED";

  const progressPercent = isCompleted
    ? 100
    : (session?.progress?.percentage ?? 0);

  // Student name: firstName + lastName with fallbacks
  const studentName =
    [student.firstName, student.lastName].filter(Boolean).join(" ") ||
    student.name ||
    student.email ||
    "Unknown Student";

  // Submission timestamp
  const submittedAt = session?.submittedAt || assignment.completedAt || null;

  // Duration
  const durationSeconds = session?.timeSpentSeconds ?? null;

  // Domain scores: try all known field names from the scoring engine
  const domainScores =
    score?.domainScores ||
    score?.dimensionScores ||
    score?.domains ||
    [];

  const isOnetInterest =
    def.code === "ONET_INTEREST_PROFILER_SHORT" ||
    def.category === "interest" ||
    score?.scoringStrategy === "riasec_holland" ||
    Boolean(score?.hollandCode);

  const isOnetWil =
    def.code === "ONET_WORK_IMPORTANCE_LOCATOR" ||
    def.category === "values" ||
    score?.scoringStrategy === "onet_wil" ||
    Boolean(score?.topWorkValues?.length > 0);

  const hollandCode = score?.hollandCode || score?.metadata?.hollandCode || "";
  const topWorkValues = score?.topWorkValues || score?.metadata?.topWorkValues || [];
  const wilHeadline = score?.overallCode || (topWorkValues.length > 0 ? topWorkValues.join(" · ") : "");

  const displayScores = isOnetInterest && score?.categoryScores?.length > 0
    ? score.categoryScores
    : isOnetWil && score?.workValueScores?.length > 0
    ? score.workValueScores.map((wv) => ({
        ...wv,
        domain: wv.code,
        name: wv.name,
        rawScore: wv.weightedScore,
        score: wv.weightedScore,
        maxScore: 30,
        minScore: 6,
      }))
    : domainScores;

  // Retake eligibility
  const canRetake = isCompleted;

  // ── Retake handlers ────────────────────────────────────────────────────────
  const handleOpenRetake = () => {
    setRetakeDialog(true);
    setRetakeNotes("");
  };

  const handleCloseRetake = () => {
    setRetakeDialog(false);
    setRetakeNotes("");
  };

  const handleRetake = async () => {
    if (!retakeNotes.trim()) {
      toast.error("Please provide a reason explaining why a retake is required.");
      return;
    }
    try {
      await rejectMutation.mutateAsync({
        assignmentId: assignment._id,
        counselorNotes: retakeNotes,
      });
      toast.success("Retake requested for student.");
      handleCloseRetake();
      refetch();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Action failed.");
    }
  };

  // ── Recompute score handler (Safety Net Action) ───────────────────────────
  const handleRescore = async () => {
    try {
      await rescoreMutation.mutateAsync(assignment._id);
      toast.success("Assessment score recomputed successfully.");
      refetch();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to recompute score.");
    }
  };

  // ── Raw response filtering & sorting ───────────────────────────────────────
  const domainsList = Array.from(
    new Set(rawResponses.map((r) => r.domain).filter(Boolean))
  );

  const filteredResponses =
    responseFilter === "all"
      ? rawResponses
      : rawResponses.filter((r) => r.domain === responseFilter);

  // Bug 3 Fix: Always sort ascending 1 -> 120
  const sortedResponses = [...filteredResponses].sort(
    (a, b) => (a.questionNumber || 0) - (b.questionNumber || 0)
  );

  return (
    <div className="space-y-6">
      {/* ── Page Header ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => router.push("/assessments")}
            className="shrink-0"
            aria-label="Back to assessment list"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight">
                {def.title || "Assessment"} — Results
              </h1>
              <Badge variant={statusInfo.variant} className="text-xs">
                {statusInfo.label}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {studentName}
              {student.email && (
                <span className="opacity-60"> · {student.email}</span>
              )}
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {isCompleted && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1.5"
              disabled={rescoreMutation.isPending}
              onClick={handleRescore}
            >
              <RefreshCw className={`size-3.5 ${rescoreMutation.isPending ? "animate-spin" : ""}`} />
              Recompute Score
            </Button>
          )}

          {canRetake && (
            <Button
              variant="destructive"
              size="sm"
              className="text-xs gap-1.5"
              onClick={handleOpenRetake}
            >
              <RotateCcw className="size-3.5" />
              Request Retake
            </Button>
          )}
        </div>
      </div>

      {/* ── Summary Info Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Student Name */}
        <div className="p-4 rounded-xl border border-border/60 bg-card space-y-1">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
            <User className="size-3.5 text-primary" /> Student Name
          </p>
          <p className="text-sm font-semibold truncate">{studentName}</p>
        </div>

        {/* Completion Progress */}
        <div className="p-4 rounded-xl border border-border/60 bg-card space-y-1">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
            <Clock className="size-3.5 text-amber-500" /> Completion Progress
          </p>
          <div className="flex items-center gap-2 pt-0.5">
            <Progress value={progressPercent} className="h-2 flex-1" />
            <span className="text-xs font-semibold tabular-nums">
              {Math.round(progressPercent)}%
            </span>
          </div>
        </div>

        {/* Submission Time */}
        <div className="p-4 rounded-xl border border-border/60 bg-card space-y-1">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
            <Calendar className="size-3.5 text-blue-500" /> Submission Time
          </p>
          <p className="text-xs font-medium">{formatDate(submittedAt)}</p>
        </div>

        {/* Duration */}
        <div className="p-4 rounded-xl border border-border/60 bg-card space-y-1">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
            <Timer className="size-3.5 text-violet-500" /> Duration Spent
          </p>
          <p className="text-sm font-semibold">{formatDuration(durationSeconds)}</p>
        </div>
      </div>

      {/* ── Quick-completion warning banner ──────────────────────────────────── */}
      {session?.flagged && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
          <AlertTriangle className="size-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
              Unusually Quick Submission
            </p>
            <p className="text-xs text-amber-700/80 dark:text-amber-400/80 leading-relaxed">
              This assessment ({session?.progress?.totalQuestions ?? "120"} items) was
              completed in{" "}
              <span className="font-semibold">{formatDuration(durationSeconds)}</span> — under
              5 minutes. Review the raw responses carefully before proceeding.
            </p>
          </div>
        </div>
      )}

      {/* ── Counselor notes (retake reason) if present ───────────────────────── */}
      {assignment.counselorNotes && (
        <div className="p-4 rounded-xl bg-muted/40 border border-border/60 space-y-1">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <FileText className="size-3.5" /> Retake Request Notes
          </p>
          <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">
            {assignment.counselorNotes}
          </p>
        </div>
      )}
      {/* ── Previous Attempts Breakdown ─────────────────────────────────────── */}
      {previousAttempts.length > 0 && (
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="size-4 text-amber-600 dark:text-amber-400" />
              <h3 className="font-bold text-sm text-foreground">
                Previous Assessment Attempt(s) ({previousAttempts.length})
              </h3>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-xs font-medium"
              onClick={() => setShowPrevAttempts((prev) => !prev)}
            >
              {showPrevAttempts ? "Hide Previous Attempts" : "View Previous Attempt(s)"}
            </Button>
          </div>

          {showPrevAttempts && (
            <div className="space-y-3 pt-2 border-t border-amber-500/20">
              {previousAttempts.map((prev, idx) => (
                <div key={prev.sessionId || idx} className="p-3.5 rounded-lg border border-border bg-card space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">
                      Attempt #{previousAttempts.length - idx} (Superseded)
                    </span>
                    <span className="text-muted-foreground font-mono">
                      {formatDate(prev.session?.completedAt || prev.requestedAt)}
                    </span>
                  </div>
                  {prev.reason && (
                    <p className="text-muted-foreground italic">
                      Retake Reason: &ldquo;{prev.reason}&rdquo;
                    </p>
                  )}
                  {prev.score && prev.score.domainScores && (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                      {prev.score.domainScores.map((ds) => (
                        <div key={ds.domain} className="p-2 rounded bg-muted/50 border border-border/60 text-center">
                          <span className="font-bold block text-xs">{ds.domain}</span>
                          <span className="text-[11px] text-muted-foreground">{ds.score} ({ds.band})</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Main Detail Tabs ─────────────────────────────────────────────────── */}
      <Tabs defaultValue="scores" className="space-y-4">
        <TabsList>
          <TabsTrigger value="scores" className="gap-1.5 text-xs">
            <BarChart2 className="size-3.5" /> Scores Summary
          </TabsTrigger>
          <TabsTrigger value="facets" className="gap-1.5 text-xs">
            <Layers className="size-3.5" /> Facet Breakdowns
          </TabsTrigger>
          <TabsTrigger value="raw" className="gap-1.5 text-xs">
            <FileText className="size-3.5" /> Raw Responses ({rawResponses.length})
          </TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Scores Summary ───────────────────────────────────────────── */}
        <TabsContent value="scores" className="space-y-4">
          {/* Prominent Holland Code Badge for O*NET Interest Profiler */}
          {hollandCode && (
            <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-primary/10 to-blue-500/10 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
              <div>
                <div className="text-xs uppercase font-mono font-bold tracking-wider text-emerald-600 dark:text-emerald-400">
                  Primary Assessment Takeaway
                </div>
                <h3 className="text-3xl font-extrabold font-mono tracking-tight text-foreground mt-1">
                  Holland Code: <span className="text-emerald-600 dark:text-emerald-400">{hollandCode}</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Your top three interest areas, ranked in order of student interest strength.
                </p>
              </div>
              <Badge variant="outline" className="text-sm font-mono px-4 py-2 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 shrink-0">
                Top 3 Interests: {hollandCode}
              </Badge>
            </div>
          )}

          {/* Prominent Top Work Values Badge for O*NET Work Importance Locator */}
          {isOnetWil && wilHeadline && (
            <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-500/10 via-primary/10 to-blue-500/10 border border-purple-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
              <div>
                <div className="text-xs uppercase font-mono font-bold tracking-wider text-purple-600 dark:text-purple-400">
                  Primary Assessment Takeaway
                </div>
                <h3 className="text-3xl font-extrabold font-mono tracking-tight text-foreground mt-1">
                  Top Work Values: <span className="text-purple-600 dark:text-purple-400">{wilHeadline}</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Your top two work values derived from your forced-rank sorting.
                </p>
              </div>
              <Badge variant="outline" className="text-sm font-mono px-4 py-2 border-purple-500/40 text-purple-600 dark:text-purple-400 bg-purple-500/10 shrink-0">
                Top 2: {wilHeadline}
              </Badge>
            </div>
          )}

          {displayScores.length === 0 ? (
            <SectionCard title="Scores Summary">
              <div className="py-6 text-center space-y-3">
                <p className="text-xs text-muted-foreground italic">
                  {isCompleted
                    ? "Scores are not yet available for this submission."
                    : "Score computation occurs upon student submission. No scores yet."}
                </p>
                {isCompleted && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs gap-1.5"
                    disabled={rescoreMutation.isPending}
                    onClick={handleRescore}
                  >
                    <RefreshCw className={`size-3.5 ${rescoreMutation.isPending ? "animate-spin" : ""}`} />
                    Trigger Score Engine Now
                  </Button>
                )}
              </div>
            </SectionCard>
          ) : (
            <div className="space-y-4">
              {displayScores.map((dom, idx) => (
                <DomainScoreCard
                  key={dom.code || dom.domain || dom.dimensionName || dom.name || idx}
                  domain={dom}
                  defaultExpanded={false}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Tab 2: Facet Breakdowns ────────────────────────────────────────── */}
        <TabsContent value="facets" className="space-y-4">
          {domainScores.length === 0 ? (
            <SectionCard title="Facet Scores">
              <p className="text-xs text-muted-foreground italic py-4">
                No facet scores available.
              </p>
            </SectionCard>
          ) : (
            <div className="space-y-6">
              {domainScores.map((dim, dIdx) => {
                const facets = dim.facetScores || dim.facets || [];
                if (facets.length === 0) return null;
                const dimName =
                  dim.dimensionName || dim.domainName || dim.name || `Domain ${dIdx + 1}`;
                return (
                  <SectionCard
                    key={dIdx}
                    title={`${dimName} — Facets`}
                    subtitle={`Detailed breakdown of sub-traits under ${dimName}`}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                      {facets.map((facet, fIdx) => (
                        <FacetScoreRow key={fIdx} facet={facet} />
                      ))}
                    </div>
                  </SectionCard>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── Tab 3: Raw Responses Table (Grouped by Section 1–4) ──────────────── */}
        <TabsContent value="raw" className="space-y-4">
          <SectionCard
            title="Raw Student Responses"
            subtitle="Complete item-by-item student answers (Sorted 1 → 120, Grouped by Section)"
            action={
              domainsList.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">Filter Domain:</span>
                  <select
                    value={responseFilter}
                    onChange={(e) => setResponseFilter(e.target.value)}
                    className="h-7 text-xs rounded-md border border-input bg-background px-2 py-0.5"
                  >
                    <option value="all">All Domains</option>
                    {domainsList.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              )
            }
          >
            {filteredResponses.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-4">
                {isCompleted
                  ? "No response records found for this session."
                  : "The student has not submitted responses yet."}
              </p>
            ) : (
              <div className="space-y-6 pt-2">
                {[
                  { title: "Part 1 — Section 1 (Items 1–30)", start: 1, end: 30 },
                  { title: "Part 2 — Section 2 (Items 31–60)", start: 31, end: 60 },
                  { title: "Part 3 — Section 3 (Items 61–90)", start: 61, end: 90 },
                  { title: "Part 4 — Section 4 (Items 91–120)", start: 91, end: 120 },
                ].map((part) => {
                  const partResponses = sortedResponses.filter(
                    (r) => r.questionNumber >= part.start && r.questionNumber <= part.end
                  );
                  if (partResponses.length === 0) return null;

                  return (
                    <div key={part.title} className="rounded-xl border border-border/80 overflow-hidden bg-card">
                      <div className="bg-muted/50 px-4 py-2.5 border-b border-border/80 flex items-center justify-between">
                        <span className="text-xs font-bold tracking-tight text-foreground">
                          {part.title}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {partResponses.length} items
                        </Badge>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left border-collapse">
                          <thead>
                            <tr className="border-b border-border/60 text-muted-foreground bg-muted/20 font-medium">
                              <th className="py-2.5 px-3 w-12 text-center">#</th>
                              <th className="py-2.5 px-3 min-w-[220px]">Question Text</th>
                              <th className="py-2.5 px-3 min-w-[140px]">Domain / Facet</th>
                              <th className="py-2.5 px-3 min-w-[140px]">Student Selection</th>
                              <th className="py-2.5 px-3 w-16 text-center">Value</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/40">
                            {partResponses.map((resp, idx) => (
                              <tr key={resp.questionId || idx} className="hover:bg-muted/20 transition-colors">
                                <td className="py-2 px-3 text-center font-mono text-muted-foreground">
                                  {resp.questionNumber}
                                </td>
                                <td className="py-2 px-3 font-medium text-foreground">
                                  {resp.questionText}
                                  {resp.reverseScored && (
                                    <Badge
                                      variant="outline"
                                      className="ml-2 text-[10px] py-0 px-1.5 border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10 font-medium"
                                      title="Reverse Scored Item: High response indicates a lower trait level"
                                    >
                                      Reverse Scored
                                    </Badge>
                                  )}
                                </td>
                                <td className="py-2 px-3 text-muted-foreground">
                                  <span className="font-medium text-foreground">{resp.domain}</span>
                                  {resp.facet && (
                                    <span className="block text-[10px] text-muted-foreground">
                                      {resp.facet}
                                    </span>
                                  )}
                                </td>
                                <td className="py-2 px-3">
                                  <Badge variant="outline" className="text-[11px] font-normal">
                                    {resp.selectedLabel || `Option ${resp.selectedValue}`}
                                  </Badge>
                                </td>
                                <td className="py-2 px-3 text-center font-semibold font-mono">
                                  {resp.selectedValue}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        </TabsContent>
      </Tabs>

      {/* ── Retake Request Dialog ─────────────────────────────────────────────── */}
      <Dialog open={retakeDialog} onOpenChange={(open) => !open && handleCloseRetake()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request Retake</DialogTitle>
            <DialogDescription>
              The student will be asked to redo this assessment from scratch. A clear
              explanation is required so they understand what to address.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <label className="text-xs font-medium text-muted-foreground">
              Reason for Retake{" "}
              <span className="text-destructive">(Required)</span>
            </label>
            <Textarea
              placeholder="Explain why a retake is necessary — e.g. responses appear inconsistent, session was flagged for unusually fast completion, etc."
              value={retakeNotes}
              onChange={(e) => setRetakeNotes(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          <DialogFooter>
            <DialogClose variant="outline" size="sm" onClick={handleCloseRetake}>
              Cancel
            </DialogClose>
            <Button
              size="sm"
              variant="destructive"
              disabled={rejectMutation.isPending}
              onClick={handleRetake}
            >
              {rejectMutation.isPending && (
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
              )}
              Request Retake
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

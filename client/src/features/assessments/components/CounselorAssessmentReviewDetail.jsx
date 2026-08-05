"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  useAssignmentReviewDetail,
  useApproveAssignment,
  useRejectAssignment,
  useReviewAssignment,
} from "@/features/assessments/hooks/useAssessmentAssignments";
import { PageHeader } from "@/components/layout/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
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
  CheckCircle2,
  Clock,
  Eye,
  Loader2,
  RotateCcw,
  User,
  Calendar,
  Timer,
  BarChart2,
  Layers,
  FileText,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";

const STATUS_BADGE_MAP = {
  ASSIGNED: { variant: "secondary", label: "Assigned" },
  SCHEDULED: { variant: "secondary", label: "Scheduled" },
  IN_PROGRESS: { variant: "amber", label: "In Progress" },
  COMPLETED: { variant: "info", label: "Submitted" },
  UNDER_REVIEW: { variant: "info", label: "Under Review" },
  APPROVED: { variant: "emerald", label: "Approved" },
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
  const { data, isLoading, refetch } = useAssignmentReviewDetail(assignmentId);

  const [actionDialog, setActionDialog] = useState({ open: false, type: null });
  const [counselorNotes, setCounselorNotes] = useState("");
  const [responseFilter, setResponseFilter] = useState("all");

  const approveMutation = useApproveAssignment();
  const rejectMutation = useRejectAssignment();
  const reviewMutation = useReviewAssignment();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <Loader2 className="size-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-medium">
          Loading assessment review data...
        </p>
      </div>
    );
  }

  const reviewData = data?.data || {};
  const assignment = reviewData.assignment || {};
  const session = reviewData.session || {};
  const score = reviewData.score || {};
  const rawResponses = reviewData.rawResponses || [];

  const def = assignment.assessmentDefinitionId || {};
  const student = assignment.studentId || {};
  const statusInfo = STATUS_BADGE_MAP[assignment.status] || {
    variant: "secondary",
    label: assignment.status,
  };

  const progressPercent = session.progress?.percentage ?? 0;
  const canReview = assignment.status === "COMPLETED";
  const canApprove =
    assignment.status === "COMPLETED" || assignment.status === "UNDER_REVIEW";
  const canReject =
    assignment.status === "COMPLETED" || assignment.status === "UNDER_REVIEW";

  const handleOpenAction = (type) => {
    setActionDialog({ open: true, type });
    setCounselorNotes(assignment.counselorNotes || "");
  };

  const handleCloseAction = () => {
    setActionDialog({ open: false, type: null });
    setCounselorNotes("");
  };

  const handleExecuteAction = async () => {
    const { type } = actionDialog;
    try {
      if (type === "approve") {
        await approveMutation.mutateAsync({
          assignmentId: assignment._id,
          counselorNotes: counselorNotes || undefined,
        });
        toast.success("Assessment approved successfully.");
      } else if (type === "reject") {
        if (!counselorNotes.trim()) {
          toast.error("Please provide notes explaining why a retake is requested.");
          return;
        }
        await rejectMutation.mutateAsync({
          assignmentId: assignment._id,
          counselorNotes,
        });
        toast.success("Retake requested for student.");
      } else if (type === "review") {
        await reviewMutation.mutateAsync({
          assignmentId: assignment._id,
          counselorNotes: counselorNotes || undefined,
        });
        toast.success("Assessment marked as under review.");
      }
      handleCloseAction();
      refetch();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Action failed.");
    }
  };

  const isActionPending =
    approveMutation.isPending || rejectMutation.isPending || reviewMutation.isPending;

  // Extract unique domains for filtering raw responses if desired
  const domainsList = Array.from(
    new Set(rawResponses.map((r) => r.domain).filter(Boolean))
  );

  const filteredResponses =
    responseFilter === "all"
      ? rawResponses
      : rawResponses.filter((r) => r.domain === responseFilter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => router.push("/assessments")}
            className="shrink-0"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight">
                Review: {def.title || "Assessment"}
              </h1>
              <Badge variant={statusInfo.variant} className="text-xs">
                {statusInfo.label}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Student: {student.firstName} {student.lastName} ({student.email})
            </p>
          </div>
        </div>

        {/* Action Header Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {canReview && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1 border-violet-300 text-violet-600 hover:bg-violet-50 dark:border-violet-700 dark:text-violet-400 dark:hover:bg-violet-950"
              onClick={() => handleOpenAction("review")}
            >
              <Eye className="size-3.5" />
              Mark Under Review
            </Button>
          )}
          {canApprove && (
            <Button
              size="sm"
              className="text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => handleOpenAction("approve")}
            >
              <CheckCircle2 className="size-3.5" />
              Approve Assessment
            </Button>
          )}
          {canReject && (
            <Button
              variant="destructive"
              size="sm"
              className="text-xs gap-1"
              onClick={() => handleOpenAction("reject")}
            >
              <RotateCcw className="size-3.5" />
              Request Retake
            </Button>
          )}
        </div>
      </div>

      {/* Summary Metadata Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border/60 bg-card space-y-1">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
            <User className="size-3.5 text-primary" /> Student Name
          </p>
          <p className="text-sm font-semibold truncate">
            {student.firstName} {student.lastName}
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border/60 bg-card space-y-1">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
            <Clock className="size-3.5 text-amber-500" /> Completion Progress
          </p>
          <div className="flex items-center gap-2">
            <Progress value={progressPercent} className="h-2 flex-1" />
            <span className="text-xs font-semibold">{Math.round(progressPercent)}%</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border/60 bg-card space-y-1">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
            <Calendar className="size-3.5 text-blue-500" /> Submission Time
          </p>
          <p className="text-xs font-medium">
            {formatDate(session.submittedAt || assignment.completedAt)}
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border/60 bg-card space-y-1">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
            <Timer className="size-3.5 text-violet-500" /> Duration Spent
          </p>
          <p className="text-sm font-semibold">
            {formatDuration(session.timeSpentSeconds)}
          </p>
        </div>
      </div>

      {/* Counselor Notes Display if present */}
      {assignment.counselorNotes && (
        <div className="p-4 rounded-xl bg-muted/40 border border-border/60 space-y-1">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <FileText className="size-3.5" /> Counselor Review Notes
          </p>
          <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">
            {assignment.counselorNotes}
          </p>
        </div>
      )}

      {/* Main Detail Content Tabs */}
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

        {/* Tab 1: Domain Scores Summary */}
        <TabsContent value="scores" className="space-y-4">
          {!score || !score.dimensionScores || score.dimensionScores.length === 0 ? (
            <SectionCard title="Scores Summary">
              <p className="text-xs text-muted-foreground italic py-4">
                No computed scores available yet. Score computation occurs upon student submission.
              </p>
            </SectionCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {score.dimensionScores.map((dim, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-border/60 bg-card space-y-3 shadow-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-semibold text-sm">{dim.dimensionName}</h4>
                    <Badge variant="outline" className="text-[10px]">
                      {dim.qualitativeLevel || `${Math.round(dim.normalizedScore)}%`}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Normalized Score</span>
                      <span className="font-medium text-foreground">
                        {Math.round(dim.normalizedScore)} / 100
                      </span>
                    </div>
                    <Progress value={dim.normalizedScore} className="h-2" />
                  </div>

                  <div className="flex justify-between text-[11px] text-muted-foreground pt-2 border-t border-border/50">
                    <span>Raw Score: {dim.rawScore}</span>
                    <span>Percentile: {dim.percentile || 0}th</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab 2: Facet Breakdowns */}
        <TabsContent value="facets" className="space-y-4">
          {!score || !score.dimensionScores || score.dimensionScores.length === 0 ? (
            <SectionCard title="Facet Scores">
              <p className="text-xs text-muted-foreground italic py-4">
                No facet scores available.
              </p>
            </SectionCard>
          ) : (
            <div className="space-y-6">
              {score.dimensionScores.map((dim, dIdx) => (
                <SectionCard
                  key={dIdx}
                  title={`${dim.dimensionName} Facets`}
                  subtitle={`Detailed breakdown of sub-traits under ${dim.dimensionName}`}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                    {(dim.facetScores || []).map((facet, fIdx) => (
                      <div
                        key={fIdx}
                        className="p-3 rounded-lg border border-border/40 bg-muted/20 space-y-2"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-xs font-medium truncate">
                            {facet.facetName}
                          </span>
                          <span className="text-xs font-bold text-primary">
                            {Math.round(facet.normalizedScore)}%
                          </span>
                        </div>
                        <Progress value={facet.normalizedScore} className="h-1.5" />
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                          <span>Raw: {facet.rawScore}</span>
                          {facet.qualitativeLevel && (
                            <span className="font-medium">{facet.qualitativeLevel}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab 3: Raw Responses Table */}
        <TabsContent value="raw" className="space-y-4">
          <SectionCard
            title="Raw Student Responses"
            subtitle="Complete item-by-item student answers (Read-Only)"
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
                No response items found.
              </p>
            ) : (
              <div className="overflow-x-auto pt-2">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/80 text-muted-foreground bg-muted/40 font-medium">
                      <th className="py-2.5 px-3 w-12 text-center">#</th>
                      <th className="py-2.5 px-3 min-w-[200px]">Question Text</th>
                      <th className="py-2.5 px-3 min-w-[120px]">Domain / Facet</th>
                      <th className="py-2.5 px-3 min-w-[140px]">Student Selection</th>
                      <th className="py-2.5 px-3 w-16 text-center">Value</th>
                      <th className="py-2.5 px-3 w-20 text-center">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {filteredResponses.map((resp, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-muted/20 transition-colors"
                      >
                        <td className="py-2 px-3 text-center font-mono text-muted-foreground">
                          {resp.questionNumber}
                        </td>
                        <td className="py-2 px-3 font-medium text-foreground">
                          {resp.questionText}
                          {resp.reverseScored && (
                            <span className="ml-1.5 text-[10px] text-amber-500 font-mono" title="Reverse Scored Item">
                              (R)
                            </span>
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
                        <td className="py-2 px-3 text-center font-mono text-muted-foreground text-[10px]">
                          {resp.responseTimeMs ? `${(resp.responseTimeMs / 1000).toFixed(1)}s` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </TabsContent>
      </Tabs>

      {/* Action Dialog */}
      <Dialog open={actionDialog.open} onOpenChange={(open) => !open && handleCloseAction()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionDialog.type === "approve" && "Approve Assessment"}
              {actionDialog.type === "reject" && "Request Retake"}
              {actionDialog.type === "review" && "Mark Under Review"}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.type === "approve" &&
                "Confirming will approve this assessment and unlock the next stage if applicable."}
              {actionDialog.type === "reject" &&
                "The student will be requested to retake the test. Please provide clear notes."}
              {actionDialog.type === "review" &&
                "Set status to under review while evaluating details."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <label className="text-xs font-medium text-muted-foreground">
              Counselor Notes {actionDialog.type === "reject" && "(Required)"}
            </label>
            <Textarea
              placeholder={
                actionDialog.type === "reject"
                  ? "Specify reasons for retake request..."
                  : "Optional notes for the student/records..."
              }
              value={counselorNotes}
              onChange={(e) => setCounselorNotes(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          <DialogFooter>
            <DialogClose>
              <Button variant="outline" size="sm">
                Cancel
              </Button>
            </DialogClose>
            <Button
              size="sm"
              disabled={isActionPending}
              onClick={handleExecuteAction}
              variant={actionDialog.type === "reject" ? "destructive" : "default"}
              className={
                actionDialog.type === "approve"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : ""
              }
            >
              {isActionPending && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
              {actionDialog.type === "approve" && "Approve"}
              {actionDialog.type === "reject" && "Request Retake"}
              {actionDialog.type === "review" && "Mark Under Review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

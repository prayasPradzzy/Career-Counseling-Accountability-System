"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  useCounselorAssignments,
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
  ClipboardCheck,
  Clock,
  Eye,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Users,
  Loader2,
  FileSearch,
  Inbox,
  User,
  CalendarDays,
  Timer,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

// Status tab filter definitions
const STATUS_TABS = [
  { value: "all", label: "All", icon: ClipboardCheck },
  { value: "pending", label: "Pending", icon: Clock },
  { value: "submitted", label: "Submitted", icon: FileSearch },
  { value: "under_review", label: "Reviewed", icon: Eye },
  { value: "approved", label: "Approved", icon: CheckCircle2 },
  { value: "rejected", label: "Rejected", icon: XCircle },
];

// Status → badge variant mapping
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

export default function CounselorAssessmentDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("all");
  const [actionDialog, setActionDialog] = useState({ open: false, type: null, assignment: null });
  const [counselorNotes, setCounselorNotes] = useState("");

  // Build filter based on active tab
  const filters = activeTab !== "all" ? { statusGroup: activeTab } : {};
  const { data: assignmentsData, isLoading, refetch } = useCounselorAssignments(filters);

  const approveMutation = useApproveAssignment();
  const rejectMutation = useRejectAssignment();
  const reviewMutation = useReviewAssignment();

  const assignments = assignmentsData?.data?.assignments || [];

  // Stat counters from all (unfiltered) view — computed from current tab's data
  const pendingCount = assignments.filter(
    (a) => a.status === "ASSIGNED" || a.status === "SCHEDULED"
  ).length;
  const submittedCount = assignments.filter((a) => a.status === "COMPLETED").length;
  const reviewedCount = assignments.filter((a) => a.status === "UNDER_REVIEW").length;
  const approvedCount = assignments.filter((a) => a.status === "APPROVED").length;

  const handleOpenActionDialog = (type, assignment) => {
    setActionDialog({ open: true, type, assignment });
    setCounselorNotes("");
  };

  const handleCloseDialog = () => {
    setActionDialog({ open: false, type: null, assignment: null });
    setCounselorNotes("");
  };

  const handleAction = async () => {
    const { type, assignment } = actionDialog;
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
        toast.success("Retake requested. Student will be notified.");
      } else if (type === "review") {
        await reviewMutation.mutateAsync({
          assignmentId: assignment._id,
          counselorNotes: counselorNotes || undefined,
        });
        toast.success("Assessment marked under review.");
      }
      handleCloseDialog();
      refetch();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Action failed. Please try again.");
    }
  };

  const isActionPending =
    approveMutation.isPending || rejectMutation.isPending || reviewMutation.isPending;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assessment Review"
        subtitle="Review, approve, and manage student assessment submissions across all assigned assessments."
      />

      {/* Summary Stats */}
      {!isLoading && activeTab === "all" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={Clock}
            label="Pending"
            value={pendingCount}
            color="text-amber-500"
            bgColor="bg-amber-500/10"
          />
          <StatCard
            icon={FileSearch}
            label="Submitted"
            value={submittedCount}
            color="text-blue-500"
            bgColor="bg-blue-500/10"
          />
          <StatCard
            icon={Eye}
            label="Under Review"
            value={reviewedCount}
            color="text-violet-500"
            bgColor="bg-violet-500/10"
          />
          <StatCard
            icon={CheckCircle2}
            label="Approved"
            value={approvedCount}
            color="text-emerald-500"
            bgColor="bg-emerald-500/10"
          />
        </div>
      )}

      {/* Status Filter Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full sm:w-auto overflow-x-auto">
          {STATUS_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5 text-xs">
              <tab.icon className="size-3.5" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Content for each tab renders the same list, since filtering is via API */}
        {STATUS_TABS.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center min-h-[300px] space-y-3">
                <Loader2 className="size-8 animate-spin text-primary" />
                <p className="text-xs text-muted-foreground">Loading assignments...</p>
              </div>
            ) : assignments.length === 0 ? (
              <div className="p-12 text-center rounded-xl border border-dashed border-border/80 bg-muted/20 space-y-3">
                <Inbox className="size-10 text-muted-foreground mx-auto" />
                <h3 className="font-semibold text-base">No Assignments Found</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  {activeTab === "all"
                    ? "No assessments have been assigned to your students yet."
                    : `No assessments with "${tab.label}" status.`}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {assignments.map((assignment) => (
                  <AssignmentRow
                    key={assignment._id}
                    assignment={assignment}
                    onReview={() => handleOpenActionDialog("review", assignment)}
                    onApprove={() => handleOpenActionDialog("approve", assignment)}
                    onReject={() => handleOpenActionDialog("reject", assignment)}
                    onViewDetail={() => router.push(`/assessments/review/${assignment._id}`)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Action Confirmation Dialog */}
      <Dialog open={actionDialog.open} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionDialog.type === "approve" && "Approve Assessment"}
              {actionDialog.type === "reject" && "Request Retake"}
              {actionDialog.type === "review" && "Mark Under Review"}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.type === "approve" &&
                "Confirming will approve this assessment and may unlock the next assessment in the sequence."}
              {actionDialog.type === "reject" &&
                "The student will be asked to retake this assessment. Please explain why."}
              {actionDialog.type === "review" &&
                "Mark this assessment as under review. You can add optional notes."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <label className="text-xs font-medium text-muted-foreground">
              Counselor Notes {actionDialog.type === "reject" && "(Required)"}
            </label>
            <Textarea
              placeholder={
                actionDialog.type === "reject"
                  ? "Explain why a retake is necessary..."
                  : "Optional notes for this action..."
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
              onClick={handleAction}
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

// ──────────────────────────────────────────────
// Sub-Components
// ──────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color, bgColor }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-xs hover:shadow-sm transition-shadow">
      <div className={`p-2.5 rounded-lg ${bgColor}`}>
        <Icon className={`size-5 ${color}`} />
      </div>
      <div>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function AssignmentRow({ assignment, onReview, onApprove, onReject, onViewDetail }) {
  const def = assignment.assessmentDefinitionId || {};
  const student = assignment.studentId || {};
  const session = assignment.sessionSummary;
  const statusInfo = STATUS_BADGE_MAP[assignment.status] || { variant: "secondary", label: assignment.status };

  const progressPercent = session?.progress?.percentage ?? 0;
  const canReview = assignment.status === "COMPLETED";
  const canApprove = assignment.status === "COMPLETED" || assignment.status === "UNDER_REVIEW";
  const canReject = assignment.status === "COMPLETED" || assignment.status === "UNDER_REVIEW";
  const hasDetail = assignment.status !== "ASSIGNED" && assignment.status !== "SCHEDULED";

  return (
    <div className="group rounded-xl border border-border/60 bg-card hover:border-primary/30 hover:shadow-sm transition-all duration-200 overflow-hidden">
      {/* Main Row */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-4 p-4">
        {/* Student + Assessment Info */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
            <User className="size-4" />
          </div>
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold text-sm truncate">
                {student.firstName} {student.lastName}
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

        {/* Progress Section */}
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

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5">
            {hasDetail && (
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
            {canReview && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1 border-violet-300 text-violet-600 hover:bg-violet-50 dark:border-violet-700 dark:text-violet-400 dark:hover:bg-violet-950"
                onClick={onReview}
              >
                <Eye className="size-3" />
                <span className="hidden sm:inline">Review</span>
              </Button>
            )}
            {canApprove && (
              <Button
                size="sm"
                className="h-7 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={onApprove}
              >
                <CheckCircle2 className="size-3" />
                <span className="hidden sm:inline">Approve</span>
              </Button>
            )}
            {canReject && (
              <Button
                variant="destructive"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={onReject}
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

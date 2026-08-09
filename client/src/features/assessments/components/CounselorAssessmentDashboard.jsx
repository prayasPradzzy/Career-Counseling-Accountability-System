"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  useCounselorAssignments,
  useRejectAssignment,
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
  RotateCcw,
  Loader2,
  Inbox,
  User,
  CalendarDays,
  Timer,
  TrendingUp,
  PlayCircle,
} from "lucide-react";
import { toast } from "sonner";

// ── Status tab filter definitions ────────────────────────────────────────────
const STATUS_TABS = [
  { value: "all", label: "All", icon: ClipboardCheck },
  { value: "not_started", label: "Not Started", icon: Clock },
  { value: "in_progress", label: "In Progress", icon: PlayCircle },
  { value: "completed", label: "Completed", icon: CheckCircle2 },
];

// ── Status → badge variant mapping ───────────────────────────────────────────
const STATUS_BADGE_MAP = {
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

// ── Tab value → API statusGroup mapping ──────────────────────────────────────
const TAB_TO_FILTER = {
  all: {},
  not_started: { statusGroup: "pending" },
  in_progress: { statusGroup: "in_progress" },
  completed: { statusGroup: "completed" },
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
  const [retakeDialog, setRetakeDialog] = useState({ open: false, assignment: null });
  const [retakeNotes, setRetakeNotes] = useState("");

  const filters = TAB_TO_FILTER[activeTab] || {};
  const { data: assignmentsData, isLoading, refetch } = useCounselorAssignments(filters);
  const rejectMutation = useRejectAssignment();

  const assignments = assignmentsData?.data?.assignments || [];

  // ── Stat counters (computed from current tab's unfiltered all-data call) ──
  // We always show stats on the "all" tab; on filtered tabs we hide the stat row
  // to avoid confusion. Counts are derived from the current tab's data.
  const notStartedCount = assignments.filter(
    (a) => a.status === "ASSIGNED" || a.status === "SCHEDULED"
  ).length;
  const inProgressCount = assignments.filter((a) => a.status === "IN_PROGRESS").length;
  const completedCount = assignments.filter(
    (a) =>
      a.status === "COMPLETED" ||
      a.status === "UNDER_REVIEW" ||
      a.status === "APPROVED"
  ).length;

  const handleOpenRetake = (assignment) => {
    setRetakeDialog({ open: true, assignment });
    setRetakeNotes("");
  };

  const handleCloseRetake = () => {
    setRetakeDialog({ open: false, assignment: null });
    setRetakeNotes("");
  };

  const handleRetake = async () => {
    if (!retakeNotes.trim()) {
      toast.error("Please provide a reason explaining why a retake is required.");
      return;
    }
    try {
      await rejectMutation.mutateAsync({
        assignmentId: retakeDialog.assignment._id,
        counselorNotes: retakeNotes,
      });
      toast.success("Retake requested. The student will be notified.");
      handleCloseRetake();
      refetch();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to request retake. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assessment Results"
        subtitle="View results and manage student assessment submissions."
        breadcrumbs={false}
      />

      {/* ── Summary Stats (shown only on "All" tab) ─────────────────────────── */}
      {!isLoading && activeTab === "all" && (
        <div className="grid grid-cols-3 gap-4">
          <StatCard
            icon={Clock}
            label="Not Started"
            value={notStartedCount}
            color="text-amber-500"
            bgColor="bg-amber-500/10"
          />
          <StatCard
            icon={PlayCircle}
            label="In Progress"
            value={inProgressCount}
            color="text-blue-500"
            bgColor="bg-blue-500/10"
          />
          <StatCard
            icon={CheckCircle2}
            label="Completed"
            value={completedCount}
            color="text-emerald-500"
            bgColor="bg-emerald-500/10"
          />
        </div>
      )}

      {/* ── Status Filter Tabs ───────────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full sm:w-auto overflow-x-auto">
          {STATUS_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5 text-xs">
              <tab.icon className="size-3.5" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Content for each tab renders the same list — filtering is via API */}
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
                {assignments.map((assignment, index) => (
                  <AssignmentRow
                    key={`${tab.value}-${assignment._id || assignment.id || index}`}
                    assignment={assignment}
                    onRetake={() => handleOpenRetake(assignment)}
                    onViewDetail={() =>
                      router.push(`/assessments/review/${String(assignment._id || assignment.id)}`)
                    }
                  />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* ── Retake Request Dialog ─────────────────────────────────────────────── */}
      <Dialog open={retakeDialog.open} onOpenChange={(open) => !open && handleCloseRetake()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request Retake</DialogTitle>
            <DialogDescription>
              The student will be asked to redo this assessment from scratch. A clear explanation
              is required so they understand what to address.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <label className="text-xs font-medium text-muted-foreground">
              Reason for Retake <span className="text-destructive">(Required)</span>
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

// ── Sub-Components ─────────────────────────────────────────────────────────────

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

function AssignmentRow({ assignment, onRetake, onViewDetail }) {
  const def = assignment.assessmentDefinitionId || {};
  const student = assignment.studentId || {};
  const session = assignment.sessionSummary;
  const statusInfo =
    STATUS_BADGE_MAP[assignment.status] || { variant: "secondary", label: assignment.status };

  const isCompleted =
    assignment.status === "COMPLETED" ||
    assignment.status === "UNDER_REVIEW" ||
    assignment.status === "APPROVED";
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

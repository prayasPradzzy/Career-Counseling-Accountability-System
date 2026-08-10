"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  useCounselorAssignments,
  useRejectAssignment,
} from "@/features/assessments/hooks/useAssessmentAssignments";
import { useActiveDefinitions } from "@/features/assessments/hooks/useAssessmentDefinitions";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
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
  CheckCircle2,
  Loader2,
  Inbox,
  PlayCircle,
  LayoutGrid,
  ListOrdered,
} from "lucide-react";
import { toast } from "sonner";
import AssessmentLibraryView from "./AssessmentLibraryView";
import AssessmentRosterView from "./AssessmentRosterView";
import AssignmentRow, {
  isNotStartedStatus,
  isCompletedStatus,
} from "./AssignmentRow";

// ── Status tab filter definitions (All Activity view) ────────────────────────
const STATUS_TABS = [
  { value: "all", label: "All", icon: ClipboardCheck },
  { value: "not_started", label: "Not Started", icon: Clock },
  { value: "in_progress", label: "In Progress", icon: PlayCircle },
  { value: "completed", label: "Completed", icon: CheckCircle2 },
];

// ── Top-level view toggle ────────────────────────────────────────────────────
const VIEW_TOGGLE = [
  { value: "library", label: "By Assessment", icon: LayoutGrid },
  { value: "activity", label: "All Activity", icon: ListOrdered },
];

export default function CounselorAssessmentDashboard() {
  const router = useRouter();

  // ── View state: library (default) | roster | activity ──────────────────────
  const [view, setView] = useState("library");
  const [selectedDefinition, setSelectedDefinition] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [retakeDialog, setRetakeDialog] = useState({ open: false, assignment: null });
  const [retakeNotes, setRetakeNotes] = useState("");

  // Single unfiltered fetch — the library aggregates from it, the All Activity
  // view filters the same list client-side by effective status.
  const { data: assignmentsData, isLoading, refetch } = useCounselorAssignments({});
  const { data: definitionsData, isLoading: isLoadingDefinitions } = useActiveDefinitions();
  const rejectMutation = useRejectAssignment();

  const assignments = assignmentsData?.data?.assignments || [];
  const definitions = definitionsData?.data?.definitions || [];

  // ── All Activity: client-side status filtering (same rows the API filter gave) ──
  const filteredAssignments = useMemo(() => {
    switch (activeTab) {
      case "not_started":
        return assignments.filter((a) => isNotStartedStatus(a.status));
      case "in_progress":
        return assignments.filter((a) => a.status === "IN_PROGRESS");
      case "completed":
        return assignments.filter((a) => isCompletedStatus(a.status));
      default:
        return assignments;
    }
  }, [assignments, activeTab]);

  // ── Stat counters for the "All" tab of All Activity ────────────────────────
  const notStartedCount = assignments.filter((a) => isNotStartedStatus(a.status)).length;
  const inProgressCount = assignments.filter((a) => a.status === "IN_PROGRESS").length;
  const completedCount = assignments.filter((a) => isCompletedStatus(a.status)).length;

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

  const openRoster = (definition) => {
    setSelectedDefinition(definition);
    setView("roster");
  };

  const viewDetail = (assignment) =>
    router.push(`/assessments/review/${String(assignment._id || assignment.id)}`);

  return (
    <div className="space-y-6">
      {view === "roster" ? (
        /* ── Drill-down: roster scoped to one assessment ─────────────────── */
        <AssessmentRosterView
          definition={selectedDefinition}
          assignments={assignments}
          onBack={() => setView("library")}
          onRetake={handleOpenRetake}
          onViewDetail={viewDetail}
        />
      ) : (
        <>
          <PageHeader
            title="Assessment Results"
            subtitle="View results and manage student assessment submissions."
            breadcrumbs={false}
          />

          {/* ── View Toggle: By Assessment (default) / All Activity ────────── */}
          <div className="flex items-center gap-1 p-1 rounded-lg border border-border/60 bg-muted/40 w-fit">
            {VIEW_TOGGLE.map((opt) => {
              const Icon = opt.icon;
              const isActive = view === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setView(opt.value)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    isActive
                      ? "bg-background text-foreground shadow-sm border border-border/60"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="size-3.5" />
                  {opt.label}
                </button>
              );
            })}
          </div>

          {view === "library" ? (
            /* ── Primary: Assessment Library (card grid, dynamic) ─────────── */
            <AssessmentLibraryView
              definitions={definitions}
              assignments={assignments}
              isLoading={isLoading || isLoadingDefinitions}
              onOpenRoster={openRoster}
            />
          ) : (
            /* ── Secondary: All Activity (existing flat list, unchanged) ──── */
            <>
              {/* Summary Stats (shown only on "All" tab) */}
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

                {STATUS_TABS.map((tab) => (
                  <TabsContent key={tab.value} value={tab.value}>
                    {isLoading ? (
                      <div className="flex flex-col items-center justify-center min-h-[300px] space-y-3">
                        <Loader2 className="size-8 animate-spin text-primary" />
                        <p className="text-xs text-muted-foreground">Loading assignments...</p>
                      </div>
                    ) : filteredAssignments.length === 0 ? (
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
                        {filteredAssignments.map((assignment, index) => (
                          <AssignmentRow
                            key={`${tab.value}-${assignment._id || assignment.id || index}`}
                            assignment={assignment}
                            onRetake={() => handleOpenRetake(assignment)}
                            onViewDetail={() => viewDetail(assignment)}
                          />
                        ))}
                      </div>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            </>
          )}
        </>
      )}

      {/* ── Retake Request Dialog (shared by roster + All Activity) ─────────── */}
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

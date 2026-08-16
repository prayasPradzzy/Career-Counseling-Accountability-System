"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { OverviewSection } from "./sections/OverviewSection";
import { AssessmentHistorySection } from "./sections/AssessmentHistorySection";
import { DemographicsSection } from "./sections/DemographicsSection";
import { ConsentCard } from "./ConsentCard";
import { InterviewTab } from "@/features/interviews/components/InterviewTab";
import { GuardianCard } from "./GuardianCard";
import { SectionCard } from "@/components/common/SectionCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AssignAssessmentDialog } from "./AssignAssessmentDialog";
import { useStudentAssignments, useAssignAssessment, useAssignAllAssessments } from "@/features/assessments/hooks/useAssessmentAssignments";
import { useActiveDefinitions } from "@/features/assessments/hooks/useAssessmentDefinitions";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  LayoutDashboard,
  UserCircle,
  BookOpen,
  Loader2,
  Users,
  UserCheck,
  Award,
  MessagesSquare,
} from "lucide-react";

import { TransferOwnershipDialog } from "./TransferOwnershipDialog";
import { useAssignCounselor } from "../hooks/useStudents";

/**
 * StudentProfileHub Component
 * Central Hub Architecture for Student Profile.
 * Integrates 6 career-guidance sections into a unified tabbed layout.
 */
export function StudentProfileHub({
  profile,
  onToggleConsent,
  isUpdatingConsent = false,
  onToggleAudioConsent,
  isUpdatingAudioConsent = false,
}) {
  const [activeTab, setActiveTab] = useState("overview");
  const [assignAssessmentOpen, setAssignAssessmentOpen] = useState(false);
  const [assignAllOpen, setAssignAllOpen] = useState(false);
  const [transferOwnershipOpen, setTransferOwnershipOpen] = useState(false);
  const { user } = useAuth();

  const studentUserId = profile?.userId?._id || profile?.userId;
  const isCounselorOrAdmin = user?.role === "counselor" || user?.role === "admin";
  const isAdmin = user?.role === "admin";

  const transferCounselorMutation = useAssignCounselor();

  const handleTransferCounselor = (counselorId) => {
    const studentProfileId = profile._id || studentUserId;
    transferCounselorMutation.mutate(
      { id: studentProfileId, counselorId },
      {
        onSuccess: () => {
          toast.success("Student ownership transferred successfully!");
          setTransferOwnershipOpen(false);
        },
        onError: (err) => {
          toast.error(err?.response?.data?.message || "Failed to transfer ownership.");
        },
      }
    );
  };

  // Fetch real assignments for this student
  const { data: assignmentsData } = useStudentAssignments(studentUserId);
  const assignments = assignmentsData?.data?.assignments || [];

  // Assign assessment mutation + full-battery mutation
  const assignAssessmentMutation = useAssignAssessment();
  const assignAllMutation = useAssignAllAssessments();
  const { data: definitionsData } = useActiveDefinitions();
  const activeDefinitionCount = definitionsData?.data?.definitions?.length || 0;

  const handleAssignAll = () => {
    assignAllMutation.mutate(studentUserId, {
      onSuccess: (res) => {
        toast.success(
          res?.data?.message ||
            `Full battery assigned: ${res?.data?.createdCount ?? 0} created, ${res?.data?.skippedCount ?? 0} already assigned.`
        );
        setAssignAllOpen(false);
      },
      onError: (err) => {
        toast.error(err?.response?.data?.message || "Failed to assign full battery.");
      },
    });
  };

  const handleAssignAssessment = (formData) => {
    assignAssessmentMutation.mutate(
      {
        studentId: studentUserId,
        assessmentDefinitionId: formData.assessmentDefinitionId,
        dueDate: formData.dueDate || undefined,
        counselorNotes: formData.counselorNotes || "",
      },
      {
        onSuccess: () => {
          toast.success("Assessment assigned successfully!");
          setAssignAssessmentOpen(false);
        },
        onError: (err) => {
          toast.error(err?.response?.data?.message || "Failed to assign assessment.");
        },
      }
    );
  };

  const userObj = profile?.userId || {};
  const fullName = `${userObj.firstName || ""} ${userObj.lastName || ""}`.trim() || "Unnamed Student";

  return (
    <div className="space-y-6">
      {/* Modular Tab Navigation Bar */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="overflow-x-auto pb-1 scrollbar-none">
          <TabsList className="h-10 w-max min-w-full justify-start bg-muted p-1 rounded-xl gap-1">
            <TabsTrigger value="overview" className="text-xs gap-1.5 px-3">
              <LayoutDashboard className="size-3.5" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="demographics" className="text-xs gap-1.5 px-3">
              <UserCircle className="size-3.5" />
              Demographics
            </TabsTrigger>
            <TabsTrigger value="guardian" className="text-xs gap-1.5 px-3">
              <Users className="size-3.5" />
              Guardian
            </TabsTrigger>
            <TabsTrigger value="counselor" className="text-xs gap-1.5 px-3">
              <UserCheck className="size-3.5" />
              Counselor
            </TabsTrigger>
            <TabsTrigger value="assessments" className="text-xs gap-1.5 px-3">
              <Award className="size-3.5" />
              Assessments & Scores
            </TabsTrigger>
            {isCounselorOrAdmin && (
              <TabsTrigger value="interview" className="text-xs gap-1.5 px-3">
                <MessagesSquare className="size-3.5" />
                Interview
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        {/* 1. Overview Hub Tab */}
        <TabsContent value="overview" className="mt-4 space-y-6">
          <OverviewSection
            profile={profile}
            onTransferOwnership={isAdmin ? () => setTransferOwnershipOpen(true) : undefined}
            isAdmin={isAdmin}
          />
          {/* Consent (incl. audio-recording consent required before interview recording) */}
          {isCounselorOrAdmin && (
            <ConsentCard
              consentStatus={profile?.consentStatus}
              onUpdateConsent={onToggleConsent}
              isUpdating={isUpdatingConsent}
              onToggleAudioConsent={onToggleAudioConsent}
              isUpdatingAudioConsent={isUpdatingAudioConsent}
            />
          )}
        </TabsContent>

        {/* 2. Demographics Tab — merged Personal Info + Education, editable */}
        <TabsContent value="demographics" className="mt-4">
          <DemographicsSection profile={profile} studentUserId={studentUserId} />
        </TabsContent>

        {/* 3. Guardian Tab */}
        <TabsContent value="guardian" className="mt-4">
          <GuardianCard guardianInfo={profile?.guardianInfo} />
        </TabsContent>

        {/* 5. Assigned Counselor Tab */}
        <TabsContent value="counselor" className="mt-4">
          <SectionCard
            title="Assigned Guidance Counselor"
            subtitle="Primary counselor owning this student's guidance roadmap"
            iconName="UserCheck"
            action={
              isAdmin && (
                <button onClick={() => setTransferOwnershipOpen(true)} className="text-xs font-semibold text-primary hover:underline">
                  Transfer Student Ownership
                </button>
              )
            }
          >
            <div className="p-4 rounded-xl border border-border/80 bg-card space-y-3 pt-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <h4 className="font-bold text-sm text-foreground">
                    {profile?.assignedCounselorId
                      ? typeof profile.assignedCounselorId === "object"
                        ? `${profile.assignedCounselorId.firstName || ""} ${profile.assignedCounselorId.lastName || ""}`.trim() || profile.assignedCounselorId.email
                        : profile.assignedCounselorId
                      : "Unassigned Counselor"}
                  </h4>
                  {profile?.assignedCounselorId?.email && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Contact Email: {profile.assignedCounselorId.email}
                    </p>
                  )}
                </div>

                <Badge variant="outline" className="text-[11px] gap-1 bg-emerald-500/10 text-emerald-600 border-emerald-600/30">
                  Verified Counselor
                </Badge>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/60">
                <span>Assigned: {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}</span>
                <span className="text-[11px] italic">{isAdmin ? "Admin ownership transfer available" : "Active Counselor Ownership"}</span>
              </div>
            </div>
          </SectionCard>
        </TabsContent>

        {/* 6. Assessments Tab — Single Consolidated Per-Assessment View */}
        <TabsContent value="assessments" className="mt-4 space-y-6">
          <AssessmentHistorySection
            assignments={assignments}
            onAssignAssessment={isCounselorOrAdmin ? () => setAssignAssessmentOpen(true) : undefined}
            onAssignAll={isCounselorOrAdmin ? () => setAssignAllOpen(true) : undefined}
            isAssigningAll={assignAllMutation.isPending}
          />
        </TabsContent>

        {/* 7. Interview Tab — AI-Assisted Interview Question Generation */}
        {isCounselorOrAdmin && (
          <TabsContent value="interview" className="mt-4 space-y-6">
            <InterviewTab
              studentId={studentUserId}
              audioConsentGiven={Boolean(profile?.consentStatus?.audioRecording?.isGiven)}
            />
          </TabsContent>
        )}

      </Tabs>

      {/* Assign Assessment Dialog (Counselor/Admin only) */}
      {isCounselorOrAdmin && (
        <AssignAssessmentDialog
          open={assignAssessmentOpen}
          onOpenChange={setAssignAssessmentOpen}
          onAssign={handleAssignAssessment}
          isAssigning={assignAssessmentMutation.isPending}
          studentName={fullName}
        />
      )}

      {/* Assign Full Battery Dialog (Counselor/Admin only) */}
      {isCounselorOrAdmin && (
        <Dialog open={assignAllOpen} onOpenChange={setAssignAllOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Assign Full Battery</DialogTitle>
              <DialogDescription>
                Assign <strong>{activeDefinitionCount}</strong> active assessment{" "}
                {activeDefinitionCount === 1 ? "instrument" : "instruments"} to{" "}
                <strong>{fullName}</strong> in one go. Assessments that are already
                assigned will be skipped. The student can then move through the
                battery as one continuous flow.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setAssignAllOpen(false)} disabled={assignAllMutation.isPending}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="gap-1.5"
                onClick={handleAssignAll}
                disabled={assignAllMutation.isPending || activeDefinitionCount === 0}
              >
                {assignAllMutation.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <BookOpen className="size-3.5" />
                )}
                {assignAllMutation.isPending ? "Assigning..." : "Assign Full Battery"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Transfer Student Ownership Dialog (Admin only) */}
      {isAdmin && (
        <TransferOwnershipDialog
          open={transferOwnershipOpen}
          onOpenChange={setTransferOwnershipOpen}
          onTransfer={handleTransferCounselor}
          isTransferring={transferCounselorMutation.isPending}
          studentName={fullName}
        />
      )}
    </div>
  );
}

export default StudentProfileHub;

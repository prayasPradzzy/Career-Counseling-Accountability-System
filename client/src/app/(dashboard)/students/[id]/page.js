"use client";

import { use } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  useStudentProfile,
  useUpdateConsent,
  useAssignCounselor,
  AssignCounselorDialog,
} from "@/features/students";
import { StudentProfileHub } from "@/features/students/components/StudentProfileHub";
import { PageHeader } from "@/components/layout/PageHeader";
import { LoadingSkeleton } from "@/components/layout/LoadingSkeleton";
import { EmptyIllustration } from "@/components/common/EmptyIllustration";
import { toast } from "sonner";

export default function StudentDetailPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const studentId = params.id;
  const router = useRouter();

  const [assignDialogOpen, setAssignDialogOpen] = useState(false);

  const { data, isLoading, isError, error } = useStudentProfile(studentId);
  const updateConsentMutation = useUpdateConsent();
  const assignCounselorMutation = useAssignCounselor();

  const profile = data?.data?.profile;

  const handleToggleConsent = () => {
    const nextIsGiven = !profile?.consentStatus?.isGiven;

    updateConsentMutation.mutate(
      {
        id: studentId,
        consentData: {
          isGiven: nextIsGiven,
          consentFormUrl: profile?.consentStatus?.consentFormUrl || "",
        },
      },
      {
        onSuccess: () => {
          toast.success(
            nextIsGiven ? "Data consent authorized" : "Data consent revoked"
          );
        },
        onError: (err) => {
          toast.error(err.response?.data?.message || "Failed to update consent status");
        },
      }
    );
  };

  const handleAssignCounselor = (counselorId) => {
    assignCounselorMutation.mutate(
      { id: studentId, counselorId },
      {
        onSuccess: () => {
          toast.success("Counselor assigned successfully!");
          setAssignDialogOpen(false);
        },
        onError: (err) => {
          toast.error(err.response?.data?.message || "Failed to assign counselor");
        },
      }
    );
  };

  /* ── Loading State ── */
  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Student Profile" subtitle="Loading student record..." />
        <LoadingSkeleton cards={3} />
      </div>
    );
  }

  /* ── Error / Not Found State ── */
  if (isError || !profile) {
    return (
      <div className="space-y-6">
        <PageHeader title="Student Profile" subtitle="Student Record" />
        <EmptyIllustration
          iconName="AlertTriangle"
          title="Student Record Not Found"
          description={error?.response?.data?.message || "The requested student profile could not be retrieved."}
          actionLabel="Back to Directory"
          onAction={() => router.push("/students")}
        />
      </div>
    );
  }

  /* ── Main Render: Central Hub ── */
  return (
    <div className="space-y-6">
      <StudentProfileHub
        profile={profile}
        onAssignCounselor={() => setAssignDialogOpen(true)}
        onToggleConsent={handleToggleConsent}
        isUpdatingConsent={updateConsentMutation.isPending}
      />

      {/* Assign Counselor Modal Dialog */}
      <AssignCounselorDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        onAssign={handleAssignCounselor}
        isAssigning={assignCounselorMutation.isPending}
      />
    </div>
  );
}

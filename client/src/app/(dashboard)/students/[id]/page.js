"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import {
  useStudentProfile,
  useUpdateConsent,
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

  const { data, isLoading, isError, error } = useStudentProfile(studentId);
  const updateConsentMutation = useUpdateConsent();

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

  const handleToggleAudioConsent = () => {
    const nextAudioGiven = !profile?.consentStatus?.audioRecording?.isGiven;

    updateConsentMutation.mutate(
      {
        id: studentId,
        consentData: { audioRecording: { isGiven: nextAudioGiven } },
      },
      {
        onSuccess: () => {
          toast.success(
            nextAudioGiven
              ? "Audio recording consent granted"
              : "Audio recording consent revoked"
          );
        },
        onError: (err) => {
          toast.error(err.response?.data?.message || "Failed to update consent status");
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
        onToggleConsent={handleToggleConsent}
        isUpdatingConsent={updateConsentMutation.isPending}
        onToggleAudioConsent={handleToggleAudioConsent}
        isUpdatingAudioConsent={updateConsentMutation.isPending}
      />
    </div>
  );
}

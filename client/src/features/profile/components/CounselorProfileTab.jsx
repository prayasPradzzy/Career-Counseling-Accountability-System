"use client";

import { BasicInfoSection } from "./BasicInfoSection";
import { ProfessionalCredentialsSection } from "./ProfessionalCredentialsSection";
import { SpecializationSection } from "./SpecializationSection";
import { CaseloadSummarySection } from "./CaseloadSummarySection";
import { AccountSecuritySection } from "./AccountSecuritySection";
import { WidgetGrid } from "@/components/layout/WidgetGrid";

export function CounselorProfileTab({ user, profile }) {
  return (
    <div className="space-y-6">
      <WidgetGrid cols={{ default: 1, lg: 2 }} gap="gap-6">
        <BasicInfoSection user={user} profile={profile} />
        <ProfessionalCredentialsSection credentials={profile?.credentials} />
        <SpecializationSection practice={profile?.practice} />
        <AccountSecuritySection user={user} />
      </WidgetGrid>

      {/* Caseload Summary Full-width Section */}
      <CaseloadSummarySection />
    </div>
  );
}

export default CounselorProfileTab;

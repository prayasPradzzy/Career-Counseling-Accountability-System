import { WidgetGrid } from "@/components/layout/WidgetGrid";
import { InfoCard } from "@/components/common/InfoCard";
import { SectionCard } from "@/components/common/SectionCard";
import { ProgressCard } from "@/components/common/ProgressCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Calendar, FileText, Compass, Clock, CheckCircle2 } from "lucide-react";

export function OverviewSection({ profile, onAssignCounselor, onToggleConsent }) {
  const user = profile?.userId || {};
  const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Unnamed Student";
  const counselor = profile?.assignedCounselorId;
  const counselorName = counselor
    ? typeof counselor === "object"
      ? `${counselor.firstName || ""} ${counselor.lastName || ""}`.trim() || counselor.email
      : counselor
    : "Unassigned";

  return (
    <div className="space-y-6">
      {/* Top Grid: Completeness & Quick Summary Cards */}
      <WidgetGrid cols={{ default: 1, lg: 2 }} gap="gap-6">
        <ProgressCard
          title="Profile Completeness"
          subtitle="Demographics, education, career goals, skills, and consent status"
          percentage={profile?.completionPercentage || 0}
          iconName="Target"
          note={profile?.completionPercentage >= 80 ? "High Completion" : "Action Required"}
        />

        <SectionCard
          title="Assigned Guidance Counselor"
          subtitle="Primary counselor taking ownership of guidance roadmap"
          iconName="UserCheck"
        >
          <div className="flex items-center justify-between p-3.5 rounded-lg border border-border bg-muted/20 pt-1">
            <div className="space-y-0.5">
              <p className="font-semibold text-sm text-foreground">{counselorName}</p>
              <p className="text-xs text-muted-foreground">
                {counselor?.email ? counselor.email : "No counselor assigned yet"}
              </p>
            </div>
            {onAssignCounselor && (
              <button
                onClick={onAssignCounselor}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Change Counselor
              </button>
            )}
          </div>
        </SectionCard>
      </WidgetGrid>

      {/* Main Grid: Overview Summary Cards */}
      <WidgetGrid cols={{ default: 1, lg: 2 }} gap="gap-6">
        {/* Basic Demographics Summary */}
        <InfoCard
          title="Personal Identification"
          subtitle="Core contact and demographic details"
          iconName="UserCircle"
          items={[
            { label: "Student Name", value: fullName },
            { label: "Email Address", value: user.email },
            { label: "Phone Number", value: profile?.phone || "Not provided" },
            {
              label: "Date of Birth",
              value: profile?.dateOfBirth
                ? new Date(profile.dateOfBirth).toLocaleDateString()
                : "Not provided",
            },
            { label: "Gender Identity", value: profile?.gender || "Not specified" },
            { label: "Account Role", value: user.role || "student" },
          ]}
        />

        {/* Guardian Contact */}
        <InfoCard
          title="Parent / Guardian Contact"
          subtitle="Primary emergency and parental contact"
          iconName="Users"
          items={[
            { label: "Guardian Name", value: profile?.guardianInfo?.name || "Not provided" },
            { label: "Relationship", value: profile?.guardianInfo?.relationship || "Not specified" },
            { label: "Guardian Email", value: profile?.guardianInfo?.email || "Not provided" },
            { label: "Guardian Phone", value: profile?.guardianInfo?.phone || "Not provided" },
          ]}
        />

        {/* Academic History Snapshot */}
        <SectionCard
          title="Academic History"
          subtitle="Education degree background"
          iconName="BookOpen"
        >
          {profile?.education && profile.education.length > 0 ? (
            <div className="space-y-3 pt-1">
              {profile.education.map((edu, idx) => (
                <div key={edu._id || idx} className="p-3 rounded-lg border border-border bg-muted/20 text-sm">
                  <p className="font-semibold text-foreground">{edu.institution}</p>
                  <p className="text-xs text-primary font-medium">{edu.degree} in {edu.fieldOfStudy}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground pt-1">No academic history records added.</p>
          )}
        </SectionCard>

        {/* Target Career Roles & Skills */}
        <SectionCard
          title="Career Aspirations & Skills"
          subtitle="Target job roles and competencies"
          iconName="Target"
        >
          <div className="space-y-4 pt-1">
            <div>
              <span className="text-xs text-muted-foreground block mb-1.5">Target Roles</span>
              {profile?.careerGoals && profile.careerGoals.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {profile.careerGoals.map((g, i) => (
                    <Badge key={i} variant="outline">{g}</Badge>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">None specified</span>
              )}
            </div>

            <div>
              <span className="text-xs text-muted-foreground block mb-1.5">Key Skills</span>
              {profile?.skills && profile.skills.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {profile.skills.map((s, i) => (
                    <Badge key={i} variant="secondary">{s}</Badge>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">None specified</span>
              )}
            </div>
          </div>
        </SectionCard>
      </WidgetGrid>
    </div>
  );
}

export default OverviewSection;

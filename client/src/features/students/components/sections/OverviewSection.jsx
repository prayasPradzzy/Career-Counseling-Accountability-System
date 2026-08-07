import { WidgetGrid } from "@/components/layout/WidgetGrid";
import { InfoCard } from "@/components/common/InfoCard";
import { SectionCard } from "@/components/common/SectionCard";
import { ProgressCard } from "@/components/common/ProgressCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Calendar,
  FileText,
  Compass,
  Clock,
  CheckCircle2,
  ShieldCheck,
  UserCheck,
  Mail,
  CalendarDays,
} from "lucide-react";

/**
 * OverviewSection
 * Overview tab of Student Profile.
 * Displays read-only Assigned Counselor Card with: Name, Email, Verification Badge, Assignment Date.
 * Transfer Student Ownership action is restricted to Administrators only.
 */
export function OverviewSection({ profile, onTransferOwnership, isAdmin = false }) {
  const user = profile?.userId || {};
  const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Unnamed Student";
  const counselor = profile?.assignedCounselorId;

  const counselorName = counselor
    ? typeof counselor === "object"
      ? `${counselor.firstName || ""} ${counselor.lastName || ""}`.trim() || counselor.email
      : counselor
    : "Unassigned Counselor";

  const counselorEmail = counselor && typeof counselor === "object" ? counselor.email : null;
  const assignmentDate = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

  return (
    <div className="space-y-6">
      {/* Top Grid: Completeness & Assigned Counselor Card */}
      <WidgetGrid cols={{ default: 1, lg: 2 }} gap="gap-6">
        <ProgressCard
          title="Intake Progress"
          subtitle="Demographics, education, career goals, skills, and consent status"
          percentage={profile?.completionPercentage || 0}
          iconName="Target"
          note={profile?.completionPercentage >= 80 ? "High Completion" : "Action Required"}
        />

        {/* Read-Only Assigned Counselor Card */}
        <SectionCard
          title="Assigned Guidance Counselor"
          subtitle="Primary counselor owning this student's guidance roadmap"
          iconName="UserCheck"
          action={
            isAdmin && onTransferOwnership && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs gap-1.5"
                onClick={onTransferOwnership}
              >
                <ShieldCheck className="size-3.5 text-primary" />
                Transfer Ownership
              </Button>
            )
          }
        >
          <div className="p-4 rounded-xl border border-border/80 bg-card space-y-3 pt-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <h4 className="font-bold text-sm text-foreground">{counselorName}</h4>
                {counselorEmail && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Mail className="size-3" />
                    {counselorEmail}
                  </p>
                )}
              </div>

              {/* Verification Badge */}
              <Badge variant="outline" className="text-[11px] gap-1 bg-emerald-500/10 text-emerald-600 border-emerald-600/30">
                <CheckCircle2 className="size-3 text-emerald-600" />
                Verified Counselor
              </Badge>
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border/60">
              <span className="flex items-center gap-1 font-medium">
                <CalendarDays className="size-3.5 text-primary" />
                Assigned: {assignmentDate}
              </span>
              <span className="text-[11px] text-muted-foreground italic">
                {isAdmin ? "Admin can reassign ownership above" : "Counselor ownership active"}
              </span>
            </div>
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
            { label: "Email Address", value: user.email || profile?.invitedEmail },
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
              <span className="text-xs text-muted-foreground block mb-1.5 font-medium">Target Roles</span>
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
              <span className="text-xs text-muted-foreground block mb-1.5 font-medium">Key Skills</span>
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

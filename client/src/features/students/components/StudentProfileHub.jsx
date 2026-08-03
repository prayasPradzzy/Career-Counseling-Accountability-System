"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { OverviewSection } from "./sections/OverviewSection";
import { AssessmentHistorySection } from "./sections/AssessmentHistorySection";
import { AssessmentScoresSection } from "./sections/AssessmentScoresSection";
import { InterviewSessionsSection } from "./sections/InterviewSessionsSection";
import { InterviewNotesSection } from "./sections/InterviewNotesSection";
import { AIInsightsSection } from "./sections/AIInsightsSection";
import { RecommendationsSection } from "./sections/RecommendationsSection";
import { ReportsSection } from "./sections/ReportsSection";
import { ProgressTimelineSection } from "./sections/ProgressTimelineSection";
import { InfoCard } from "@/components/common/InfoCard";
import { GuardianCard } from "./GuardianCard";
import { ConsentCard } from "./ConsentCard";
import { SectionCard } from "@/components/common/SectionCard";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  UserCircle,
  BookOpen,
  Users,
  UserCheck,
  Award,
  Calendar,
  FileText,
  BrainCircuit,
  Compass,
  TrendingUp,
  Settings as SettingsIcon,
} from "lucide-react";

/**
 * StudentProfileHub Component
 * Central Hub Architecture for Student Profile.
 * Integrates all 14 modular sections into a unified tabbed extension layout.
 */
export function StudentProfileHub({
  profile,
  onAssignCounselor,
  onToggleConsent,
  isUpdatingConsent = false,
}) {
  const [activeTab, setActiveTab] = useState("overview");

  const user = profile?.userId || {};
  const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Unnamed Student";

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
            <TabsTrigger value="personal" className="text-xs gap-1.5 px-3">
              <UserCircle className="size-3.5" />
              Personal Info
            </TabsTrigger>
            <TabsTrigger value="education" className="text-xs gap-1.5 px-3">
              <BookOpen className="size-3.5" />
              Education
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
            <TabsTrigger value="interviews" className="text-xs gap-1.5 px-3">
              <Calendar className="size-3.5" />
              Interviews & Notes
            </TabsTrigger>
            <TabsTrigger value="ai-insights" className="text-xs gap-1.5 px-3">
              <BrainCircuit className="size-3.5 text-primary" />
              AI Insights
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="text-xs gap-1.5 px-3">
              <Compass className="size-3.5 text-emerald-500" />
              Recommendations
            </TabsTrigger>
            <TabsTrigger value="reports" className="text-xs gap-1.5 px-3">
              <FileText className="size-3.5" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="timeline" className="text-xs gap-1.5 px-3">
              <TrendingUp className="size-3.5" />
              Timeline
            </TabsTrigger>
          </TabsList>
        </div>

        {/* 1. Overview Hub Tab */}
        <TabsContent value="overview" className="mt-4">
          <OverviewSection
            profile={profile}
            onAssignCounselor={onAssignCounselor}
            onToggleConsent={onToggleConsent}
          />
        </TabsContent>

        {/* 2. Personal Information Tab */}
        <TabsContent value="personal" className="mt-4">
          <InfoCard
            title="Personal Identification & Contact"
            subtitle="Core demographic details and platform permissions"
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
        </TabsContent>

        {/* 3. Education Tab */}
        <TabsContent value="education" className="mt-4">
          <SectionCard
            title="Academic Background & Education History"
            subtitle="Schools, universities, degrees, and academic records"
            iconName="BookOpen"
          >
            {profile?.education && profile.education.length > 0 ? (
              <div className="space-y-3 pt-1">
                {profile.education.map((edu, idx) => (
                  <div key={edu._id || idx} className="p-4 rounded-lg border border-border bg-card space-y-1">
                    <p className="font-semibold text-sm text-foreground">{edu.institution}</p>
                    <p className="text-xs text-primary font-medium">{edu.degree} in {edu.fieldOfStudy}</p>
                    {(edu.startYear || edu.endYear) && (
                      <p className="text-xs text-muted-foreground">
                        {edu.startYear || "?"} – {edu.endYear || "Present"}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground pt-1">No academic history records added.</p>
            )}
          </SectionCard>
        </TabsContent>

        {/* 4. Guardian Tab */}
        <TabsContent value="guardian" className="mt-4">
          <GuardianCard guardianInfo={profile?.guardianInfo} />
        </TabsContent>

        {/* 5. Assigned Counselor Tab */}
        <TabsContent value="counselor" className="mt-4">
          <SectionCard
            title="Assigned Guidance Counselor"
            subtitle="Primary counselor taking ownership of guidance roadmap"
            iconName="UserCheck"
            action={
              onAssignCounselor && (
                <button onClick={onAssignCounselor} className="text-xs font-semibold text-primary hover:underline">
                  Assign / Reassign Counselor
                </button>
              )
            }
          >
            <div className="p-4 rounded-lg border border-border bg-card space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-foreground">
                  {profile?.assignedCounselorId
                    ? typeof profile.assignedCounselorId === "object"
                      ? `${profile.assignedCounselorId.firstName || ""} ${profile.assignedCounselorId.lastName || ""}`.trim() || profile.assignedCounselorId.email
                      : profile.assignedCounselorId
                    : "Unassigned"}
                </span>
                <Badge variant="outline" className="text-xs">
                  {profile?.assignedCounselorId ? "Active Assigned Counselor" : "Pending Assignment"}
                </Badge>
              </div>
              {profile?.assignedCounselorId?.email && (
                <p className="text-xs text-muted-foreground">
                  Contact Email: {profile.assignedCounselorId.email}
                </p>
              )}
            </div>
          </SectionCard>
        </TabsContent>

        {/* 6. Assessments & Scores Tab */}
        <TabsContent value="assessments" className="mt-4 space-y-6">
          <AssessmentHistorySection />
          <AssessmentScoresSection />
        </TabsContent>

        {/* 7. Interviews & Notes Tab */}
        <TabsContent value="interviews" className="mt-4 space-y-6">
          <InterviewSessionsSection />
          <InterviewNotesSection />
        </TabsContent>

        {/* 8. AI Insights Extension Tab */}
        <TabsContent value="ai-insights" className="mt-4">
          <AIInsightsSection />
        </TabsContent>

        {/* 9. Recommendations Extension Tab */}
        <TabsContent value="recommendations" className="mt-4">
          <RecommendationsSection />
        </TabsContent>

        {/* 10. Reports Extension Tab */}
        <TabsContent value="reports" className="mt-4">
          <ReportsSection />
        </TabsContent>

        {/* 11. Timeline Extension Tab */}
        <TabsContent value="timeline" className="mt-4">
          <ProgressTimelineSection profile={profile} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default StudentProfileHub;

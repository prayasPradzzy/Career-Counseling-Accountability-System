"use client";

import Link from "next/link";
import { WidgetGrid } from "@/components/layout/WidgetGrid";
import { StatCard } from "@/components/common/StatCard";
import { SectionCard } from "@/components/common/SectionCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyIllustration } from "@/components/common/EmptyIllustration";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { CounselorInviteCard } from "./CounselorInviteCard";
import { Eye } from "lucide-react";

export function CounselorDashboardView({ data }) {
  const stats = data?.stats || [];
  const completed = data?.recentlyCompletedAssessments || [];

  return (
    <div className="space-y-6">
      {/* 1. Counselor Operational Stat Cards Grid */}
      <WidgetGrid cols={{ default: 1, sm: 2, lg: 3 }}>
        {stats.map((stat, idx) => (
          <StatCard
            key={stat.id || stat._id || `stat-${idx}`}
            title={stat.label}
            value={stat.value}
            note={stat.note}
            iconName={stat.iconName}
            variant={stat.variant}
          />
        ))}
      </WidgetGrid>

      {/* 2. Counselor Standing Invite Code Card */}
      <CounselorInviteCard />

      {/* 3. Main Counselor Workspace Grid */}
      <div className="space-y-6">
        {/* Recently Completed Assessments */}
        <SectionCard
          title="Recently Completed Assessments"
          subtitle="Auto-scored student psychometric & career assessment submissions"
          iconName="BookOpen"
        >
          <div className="space-y-3 pt-2">
            {completed.length === 0 ? (
              <EmptyIllustration
                iconName="BookOpen"
                title="No Completed Assessments Yet"
                description="When your assigned students complete their assessments, their auto-scored results will appear here."
                className="p-6 sm:p-8"
              />
            ) : (
              completed.map((item, idx) => {
                const targetLink = item.studentProfileId
                  ? ROUTES.STUDENT_DETAIL(item.studentProfileId)
                  : item.assignmentId
                  ? `/assessments/review/${item.assignmentId}`
                  : ROUTES.STUDENTS;

                return (
                  <div
                    key={item.id || item.assignmentId || `comp-${idx}`}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors gap-3"
                  >
                    <div className="space-y-1">
                      <span className="font-semibold text-sm text-foreground">{item.studentName}</span>
                      <p className="text-xs text-muted-foreground">
                        {item.assessmentTitle} • Completed {item.completedAt}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <StatusBadge status={item.status || "COMPLETED"} />
                      <Button variant="outline" size="sm" asChild className="text-xs gap-1.5">
                        <Link href={targetLink}>
                          <Eye className="size-3.5" />
                          View Results
                        </Link>
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

export default CounselorDashboardView;

"use client";

import Link from "next/link";
import { WidgetGrid } from "@/components/layout/WidgetGrid";
import { StatCard } from "@/components/common/StatCard";
import { SectionCard } from "@/components/common/SectionCard";
import { ProgressCard } from "@/components/common/ProgressCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyIllustration } from "@/components/common/EmptyIllustration";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/constants/routes";
import { ChevronRight } from "lucide-react";

export function StudentDashboardView({ data }) {
  const stats = data?.stats || [];
  const assessments = data?.assessmentProgress || [];

  return (
    <div className="space-y-6">
      {/* 1. Operational Stat Cards Grid */}
      <WidgetGrid cols={{ default: 1, sm: 2, lg: 4 }}>
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

      {/* 2. Main Dashboard Section Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Career Assessment Progress */}
        <div className="lg:col-span-2 space-y-6">
          <SectionCard
            title="Career Assessment Progress"
            subtitle="Assigned psychometric interest, aptitude, and personality benchmarks"
            iconName="BookOpen"
            action={
              <Button variant="ghost" size="sm" asChild className="text-xs">
                <Link href={ROUTES.ASSESSMENTS}>
                  View All Assessments
                  <ChevronRight className="ml-1 size-3.5" />
                </Link>
              </Button>
            }
          >
            <div className="space-y-3 pt-2">
              {assessments.length === 0 ? (
                <EmptyIllustration
                  iconName="BookOpen"
                  title="No Active Assessments"
                  description="You have no assigned assessments in progress. Check back when your counselor assigns new assessments."
                  className="p-6 sm:p-8"
                />
              ) : (
                assessments.map((ass, idx) => (
                  <div
                    key={ass.id || ass._id || `ass-${idx}`}
                    className="flex items-center justify-between p-3.5 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground">{ass.title}</span>
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 uppercase font-semibold">
                          {ass.category}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">Status: {ass.score}</p>
                    </div>
                    <StatusBadge status={ass.status} />
                  </div>
                ))
              )}
            </div>
          </SectionCard>
        </div>

        {/* Right Column (1 Col): Profile Completion */}
        <div className="space-y-6">
          <ProgressCard
            title="Profile Completeness"
            subtitle="Academic history & career goals"
            percentage={data?.profileCompleteness ?? 0}
            iconName="Target"
            note={(data?.profileCompleteness ?? 0) >= 80 ? "High Completion" : "Action Required"}
          />
        </div>
      </div>
    </div>
  );
}

export default StudentDashboardView;

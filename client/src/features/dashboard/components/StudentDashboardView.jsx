"use client";

import Link from "next/link";
import { WidgetGrid } from "@/components/layout/WidgetGrid";
import { StatCard } from "@/components/common/StatCard";
import { PageSection } from "@/components/common/PageSection";
import { SectionCard } from "@/components/common/SectionCard";
import { ProgressCard } from "@/components/common/ProgressCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/constants/routes";
import { BookOpen, Calendar, FileText, Compass, ListTodo, ChevronRight, CheckCircle2, Clock } from "lucide-react";

export function StudentDashboardView({ data }) {
  const stats = data?.stats || [];
  const assessments = data?.assessmentProgress || [];
  const sessions = data?.upcomingSessions || [];
  const reports = data?.latestReports || [];
  const recommendations = data?.recommendations || [];
  const tasks = data?.pendingTasks || [];

  return (
    <div className="space-y-6">
      {/* 1. Operational Stat Cards Grid */}
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

      {/* 2. Main Operational Section Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Assessment Progress & Recommendations */}
        <div className="lg:col-span-2 space-y-6">
          {/* Assessment Progress Widget */}
          <SectionCard
            title="Career Assessment Progress"
            subtitle="Psychometric interest, aptitude, and personality benchmarks"
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
              {assessments.map((ass, idx) => (
                <div
                  key={ass.id || ass._id || `ass-${idx}`}
                  className="flex items-center justify-between p-3.5 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground">{ass.title}</span>
                      <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                        {ass.category}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Result: {ass.score}</p>
                  </div>
                  <StatusBadge status={ass.status} />
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Career Recommendations Widget */}
          <SectionCard
            title="AI & Counselor Career Recommendations"
            subtitle="Matched career paths based on psychometric scores and market demand"
            iconName="Compass"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              {recommendations.map((rec, idx) => (
                <div
                  key={rec.id || rec._id || `rec-${idx}`}
                  className="p-3.5 rounded-lg border border-border bg-gradient-to-b from-card to-muted/20 space-y-2 flex flex-col justify-between"
                >
                  <div>
                    <Badge variant="secondary" className="text-[10px] mb-1.5">
                      {rec.matchScore}
                    </Badge>
                    <h4 className="font-semibold text-sm text-foreground line-clamp-2">{rec.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{rec.industry}</p>
                  </div>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    {rec.growthRate}
                  </span>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Latest Reports Widget */}
          <SectionCard
            title="Published Guidance Reports"
            subtitle="Documented summaries and roadmaps from your counselor"
            iconName="FileText"
          >
            <div className="space-y-3 pt-2">
              {reports.map((rep, idx) => (
                <div
                  key={rep.id || rep._id || `rep-${idx}`}
                  className="flex items-center justify-between p-3.5 rounded-lg border border-border bg-card"
                >
                  <div className="space-y-0.5">
                    <h4 className="font-medium text-sm text-foreground">{rep.title}</h4>
                    <p className="text-xs text-muted-foreground">
                      Counselor: {rep.counselor} • Published {rep.publishedAt}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="text-xs">
                    Download PDF
                  </Button>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* Right Column: Upcoming Sessions, Tasks & Profile Completeness */}
        <div className="space-y-6">
          {/* Profile Completion Widget */}
          <ProgressCard
            title="Profile Completeness"
            subtitle="Academic history & career goals"
            percentage={85}
            iconName="Target"
            note="Action Required"
          />

          {/* Upcoming Sessions Widget */}
          <SectionCard
            title="Upcoming Counseling Session"
            subtitle="Scheduled meetings"
            iconName="Calendar"
          >
            <div className="space-y-3 pt-2">
              {sessions.map((sess, idx) => (
                <div key={sess.id || sess._id || `sess-${idx}`} className="p-3.5 rounded-lg border border-primary/20 bg-primary/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-foreground">{sess.counselorName}</span>
                    <StatusBadge status={sess.status} />
                  </div>
                  <p className="text-xs text-muted-foreground">{sess.specialization}</p>
                  <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
                    <Clock className="size-3.5" />
                    {sess.dateTime}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Pending Tasks Widget */}
          <SectionCard
            title="Pending Tasks"
            subtitle="Your action items"
            iconName="ListTodo"
          >
            <div className="space-y-2.5 pt-2">
              {tasks.map((task, idx) => (
                <div key={task.id || task._id || `task-${idx}`} className="flex items-start gap-2.5 p-2.5 rounded-lg border border-border bg-card">
                  <Clock className="size-4 text-amber-500 mt-0.5 shrink-0" />
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-xs font-medium text-foreground">{task.title}</p>
                    <span className="text-[10px] text-muted-foreground block">{task.dueDate}</span>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

export default StudentDashboardView;

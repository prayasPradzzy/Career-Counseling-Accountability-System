"use client";

import { WidgetGrid } from "@/components/layout/WidgetGrid";
import { StatCard } from "@/components/common/StatCard";
import { SectionCard } from "@/components/common/SectionCard";
import { TimelineCard } from "@/components/common/TimelineCard";
import { Button } from "@/components/ui/button";
import { TrendingUp, FileText, Calendar, Award, Clock } from "lucide-react";

export function ParentDashboardView({ data }) {
  const stats = data?.stats || [];
  const milestones = data?.childMilestones || [];
  const reports = data?.latestReports || [];
  const sessions = data?.upcomingSessions || [];

  return (
    <div className="space-y-6">
      {/* 1. Parent Stat Cards Grid */}
      <WidgetGrid cols={{ default: 1, sm: 2, lg: 4 }}>
        {stats.map((stat) => (
          <StatCard
            key={stat.id}
            title={stat.label}
            value={stat.value}
            note={stat.note}
            iconName={stat.iconName}
            variant={stat.variant}
          />
        ))}
      </WidgetGrid>

      {/* 2. Main Parent Portal Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Child Milestone Roadmap & Reports */}
        <div className="lg:col-span-2 space-y-6">
          {/* Child Progress Milestones */}
          <SectionCard
            title="Child's Career Guidance Milestone Roadmap"
            subtitle="Longitudinal progress tracking across counseling phases"
            iconName="TrendingUp"
          >
            <div className="pt-2">
              {milestones.map((ms) => (
                <TimelineCard
                  key={ms.id}
                  title={ms.title}
                  timestamp={ms.timestamp}
                  status={ms.status}
                  description={ms.description}
                  iconName={ms.status === "completed" ? "CheckCircle2" : "Clock"}
                />
              ))}
            </div>
          </SectionCard>

          {/* Published Guidance Reports */}
          <SectionCard
            title="Child's Published Guidance Reports"
            subtitle="Official reports issued by assigned career counselor"
            iconName="FileText"
          >
            <div className="space-y-3 pt-2">
              {reports.map((rep) => (
                <div key={rep.id} className="p-4 rounded-lg border border-border bg-card space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm text-foreground">{rep.title}</h4>
                    <span className="text-xs text-muted-foreground">{rep.publishedAt}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{rep.summary}</p>
                  <div className="pt-1 flex items-center justify-between">
                    <span className="text-xs text-primary font-medium">Counselor: {rep.counselor}</span>
                    <Button variant="outline" size="sm" className="text-xs">
                      Download PDF
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* Right Column (1 Col): Upcoming Sessions */}
        <div className="space-y-6">
          <SectionCard
            title="Upcoming Counselor Meetings"
            subtitle="Parent consultation schedule"
            iconName="Calendar"
          >
            <div className="space-y-3 pt-2">
              {sessions.map((sess) => (
                <div key={sess.id} className="p-3.5 rounded-lg border border-primary/20 bg-primary/5 space-y-2">
                  <span className="font-semibold text-sm text-foreground block">{sess.counselorName}</span>
                  <p className="text-xs text-muted-foreground">{sess.type}</p>
                  <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
                    <Clock className="size-3.5" />
                    {sess.dateTime}
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

export default ParentDashboardView;

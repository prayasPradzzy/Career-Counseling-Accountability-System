"use client";

import Link from "next/link";
import { WidgetGrid } from "@/components/layout/WidgetGrid";
import { StatCard } from "@/components/common/StatCard";
import { SectionCard } from "@/components/common/SectionCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ActivityCard } from "@/components/common/ActivityCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/constants/routes";
import { Users, UserPlus, BookOpen, Calendar, FileText, ListTodo, ChevronRight, Clock, ArrowRight } from "lucide-react";

import { CounselorInviteCard } from "./CounselorInviteCard";

export function CounselorDashboardView({ data }) {
  const stats = data?.stats || [];
  const interviews = data?.interviewsToday || [];
  const unassigned = data?.studentsAwaitingAssignment || [];
  const pendingReviews = data?.assessmentsPendingReview || [];
  const draftReports = data?.reportsPendingApproval || [];
  const activity = data?.recentStudentActivity || [];
  const tasks = data?.todaysTasks || [];

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

      {/* 2. Main Counselor Workspace Section Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Interviews Today, Pending Reviews, Unassigned Queue */}
        <div className="lg:col-span-2 space-y-6">
          {/* Interviews Scheduled Today */}
          <SectionCard
            title="Interviews Scheduled Today"
            subtitle="Upcoming counseling consultations"
            iconName="Calendar"
          >
            <div className="space-y-3 pt-2">
              {interviews.map((int, idx) => (
                <div
                  key={int.id || int._id || `int-${idx}`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-lg border border-primary/20 bg-card gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground">{int.studentName}</span>
                      <span className="text-xs text-muted-foreground">({int.email})</span>
                    </div>
                    <p className="text-xs text-primary font-medium">{int.type}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1">
                      <Clock className="size-3.5 text-muted-foreground" />
                      {int.timeSlot}
                    </span>
                    <Button size="sm" className="h-8 text-xs">
                      Start Session
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Students Awaiting Assignment Queue */}
          <SectionCard
            title="Unassigned Student Queue"
            subtitle="Students waiting for counselor assignment"
            iconName="UserPlus"
            action={
              <Button variant="ghost" size="sm" asChild className="text-xs">
                <Link href={ROUTES.STUDENTS}>
                  View All Students
                  <ChevronRight className="ml-1 size-3.5" />
                </Link>
              </Button>
            }
          >
            <div className="space-y-3 pt-2">
              {unassigned.map((st, idx) => (
                <div
                  key={st.id || st._id || `st-${idx}`}
                  className="flex items-center justify-between p-3.5 rounded-lg border border-border bg-card"
                >
                  <div className="space-y-0.5">
                    <h4 className="font-medium text-sm text-foreground">{st.studentName}</h4>
                    <p className="text-xs text-muted-foreground">Registered {st.registeredAt}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-muted-foreground">
                      Profile: {st.completionPercentage}%
                    </span>
                    <Button variant="outline" size="sm" className="text-xs">
                      Claim Student
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Assessments Pending Review */}
          <SectionCard
            title="Assessments Pending Review"
            subtitle="Submitted questionnaires awaiting counselor scoring analysis"
            iconName="BookOpen"
          >
            <div className="space-y-3 pt-2">
              {pendingReviews.map((rev, idx) => (
                <div
                  key={rev.id || rev._id || `rev-${idx}`}
                  className="flex items-center justify-between p-3.5 rounded-lg border border-border bg-card"
                >
                  <div className="space-y-1">
                    <span className="font-semibold text-sm text-foreground">{rev.studentName}</span>
                    <p className="text-xs text-muted-foreground">
                      {rev.assessmentTitle} • Submitted {rev.submittedAt}
                    </p>
                  </div>
                  <Button variant="secondary" size="sm" className="text-xs">
                    Review Answers
                  </Button>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Reports Pending Approval */}
          <SectionCard
            title="Draft Reports Awaiting Sign-Off"
            subtitle="Comprehensive guidance reports ready for final verification"
            iconName="FileText"
          >
            <div className="space-y-3 pt-2">
              {draftReports.map((dr, idx) => (
                <div
                  key={dr.id || dr._id || `dr-${idx}`}
                  className="flex items-center justify-between p-3.5 rounded-lg border border-border bg-card"
                >
                  <div className="space-y-0.5">
                    <h4 className="font-medium text-sm text-foreground">{dr.reportTitle}</h4>
                    <p className="text-xs text-muted-foreground">
                      Student: {dr.studentName} • Updated {dr.lastUpdated}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="text-xs">
                    Approve & Publish
                  </Button>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* Right Column (1 Col): Counselor Tasks & Recent Activity */}
        <div className="space-y-6">
          {/* Today's Tasks */}
          <SectionCard
            title="Counselor Action Items"
            subtitle="Today's task list"
            iconName="ListTodo"
          >
            <div className="space-y-2.5 pt-2">
              {tasks.map((task, idx) => (
                <div key={task.id || task._id || `task-${idx}`} className="p-2.5 rounded-lg border border-border bg-card space-y-1">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px]">
                      {task.dueDate}
                    </Badge>
                  </div>
                  <p className="text-xs font-medium text-foreground">{task.title}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Live Student Activity Feed */}
          <SectionCard
            title="Recent Student Activity"
            subtitle="Live submission & event feed"
            iconName="Activity"
          >
            <div className="space-y-3 pt-2">
              {activity.map((act, idx) => (
                <div key={act.id || act._id || `act-${idx}`} className="p-2.5 rounded-lg border border-border bg-card space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-foreground">{act.studentName}</span>
                    <span className="text-[10px] text-muted-foreground">{act.timestamp}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{act.action}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

export default CounselorDashboardView;

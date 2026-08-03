"use client";

import { WidgetGrid } from "@/components/layout/WidgetGrid";
import { StatCard } from "@/components/common/StatCard";
import { SectionCard } from "@/components/common/SectionCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap,
  UserCheck,
  AlertCircle,
  BookOpen,
  Database,
  Activity,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";

export function AdminDashboardView({ data }) {
  const stats = data?.stats || [];
  const verifications = data?.counselorVerificationQueue || [];
  const assessmentStats = data?.assessmentStatistics || [];
  const careerSummary = data?.careerDatabaseSummary || {};
  const health = data?.platformHealth || {};

  return (
    <div className="space-y-6">
      {/* 1. Admin Command Center Stat Cards Grid */}
      <WidgetGrid cols={{ default: 1, sm: 2, lg: 3 }}>
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

      {/* 2. Main Admin Operational Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Counselor Verification Queue & Assessment Statistics */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pending Counselor Verification Queue */}
          <SectionCard
            title="Counselor Credential Verification Queue"
            subtitle="Pending counselor registration applications"
            iconName="UserCheck"
          >
            <div className="space-y-3 pt-2">
              {verifications.map((ver) => (
                <div
                  key={ver.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-lg border border-amber-500/20 bg-amber-500/5 gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground">{ver.name}</span>
                      <span className="text-xs text-muted-foreground">({ver.email})</span>
                    </div>
                    <p className="text-xs text-primary font-medium">{ver.specialization}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="outline" size="sm" className="text-xs">
                      View Credentials
                    </Button>
                    <Button size="sm" className="text-xs">
                      Verify & Approve
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Assessment System Statistics */}
          <SectionCard
            title="Assessment System Usage Statistics"
            subtitle="Total psychometric test runs and average completion durations"
            iconName="BookOpen"
          >
            <div className="space-y-3 pt-2">
              {assessmentStats.map((ast) => (
                <div
                  key={ast.id}
                  className="flex items-center justify-between p-3.5 rounded-lg border border-border bg-card"
                >
                  <div className="space-y-0.5">
                    <h4 className="font-semibold text-sm text-foreground">{ast.category}</h4>
                    <p className="text-xs text-muted-foreground">Avg Duration: {ast.avgDuration}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs font-semibold">
                    {ast.totalRuns} Test Runs
                  </Badge>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* Right Column (1 Col): Career Database Summary & Platform Health */}
        <div className="space-y-6">
          {/* Career Database Summary */}
          <SectionCard
            title="Career Database Summary"
            subtitle="O*NET Taxonomy & salary metrics"
            iconName="Database"
          >
            <div className="space-y-3 pt-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card">
                <span className="text-muted-foreground">Taxonomy Version</span>
                <span className="font-semibold text-foreground">{careerSummary.taxonomyVersion}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card">
                <span className="text-muted-foreground">Total Career Titles</span>
                <span className="font-semibold text-foreground">{careerSummary.totalCareers}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card">
                <span className="text-muted-foreground">Top Requested Industry</span>
                <span className="font-semibold text-foreground truncate max-w-[140px]">
                  {careerSummary.topRequestedIndustry}
                </span>
              </div>
            </div>
          </SectionCard>

          {/* Platform System Health */}
          <SectionCard
            title="Platform Health & Status"
            subtitle="Live infrastructure metrics"
            iconName="Activity"
          >
            <div className="space-y-2.5 pt-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
                <span className="flex items-center gap-1.5 text-foreground font-medium">
                  <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                  System Status
                </span>
                <Badge className="bg-emerald-600 text-white text-[10px]">
                  {health.status}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card">
                <span className="text-muted-foreground">Platform Uptime</span>
                <span className="font-semibold text-foreground">{health.uptimePercentage}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card">
                <span className="text-muted-foreground">API Response (p95)</span>
                <span className="font-semibold text-foreground">{health.apiLatencyP95}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card">
                <span className="text-muted-foreground">Active Client Connections</span>
                <span className="font-semibold text-foreground">{health.activeSessions}</span>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboardView;

"use client";

import { useQuery } from "@tanstack/react-query";
import { profileService } from "@/services/profile.service";
import { SectionCard } from "@/components/common/SectionCard";
import { Users, CheckCircle2, KeyRound, Ticket } from "lucide-react";
import { Loader2 } from "lucide-react";

export function CaseloadSummarySection() {
  const { data: caseloadRes, isLoading } = useQuery({
    queryKey: ["counselor-caseload"],
    queryFn: () => profileService.getCounselorCaseload(),
    staleTime: 30000,
  });

  const caseload = caseloadRes?.data || {
    activeStudents: 0,
    sessionsCompleted: 0,
    inviteCodesActive: 0,
    inviteCodesUsed: 0,
  };

  if (isLoading) {
    return (
      <SectionCard title="Caseload Summary" subtitle="Live student load & session metrics" iconName="Users">
        <div className="flex justify-center p-6">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Caseload Summary"
      subtitle="Read-only computed student capacity & completed guidance sessions"
      iconName="Users"
    >
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
        <div className="p-3.5 rounded-lg border border-border bg-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Active Students</span>
            <Users className="size-4 text-primary" />
          </div>
          <span className="text-2xl font-bold text-foreground mt-2">{caseload.activeStudents}</span>
        </div>

        <div className="p-3.5 rounded-lg border border-border bg-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Completed Sessions</span>
            <CheckCircle2 className="size-4 text-emerald-600" />
          </div>
          <span className="text-2xl font-bold text-foreground mt-2">{caseload.sessionsCompleted}</span>
        </div>

        <div className="p-3.5 rounded-lg border border-border bg-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Active Invites</span>
            <KeyRound className="size-4 text-amber-500" />
          </div>
          <span className="text-2xl font-bold text-foreground mt-2">{caseload.inviteCodesActive}</span>
        </div>

        <div className="p-3.5 rounded-lg border border-border bg-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Used Invites</span>
            <Ticket className="size-4 text-indigo-500" />
          </div>
          <span className="text-2xl font-bold text-foreground mt-2">{caseload.inviteCodesUsed}</span>
        </div>
      </div>
    </SectionCard>
  );
}

export default CaseloadSummarySection;

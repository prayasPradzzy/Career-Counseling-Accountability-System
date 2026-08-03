import { SectionCard } from "@/components/common/SectionCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Clock, CheckCircle2, Play, Lock, UserCheck, ShieldCheck } from "lucide-react";

export function AssessmentHistorySection({ assignments = [], studentId }) {
  // Generic assignment workflow display list across 5 categories: Personality, Interest, Values, Intelligence, Aptitude
  const displayAssignments = assignments.length > 0 ? assignments : [
    {
      id: "asgn-1",
      title: "Holland RIASEC Career Interest Inventory",
      category: "Interest",
      status: "APPROVED",
      dueDate: "Aug 10, 2026",
      assignedBy: "Dr. Sarah Jenkins",
      unlocked: true,
      summaryText: "Approved by counselor. Score profile generated.",
    },
    {
      id: "asgn-2",
      title: "STEM Cognitive Reasoning & Aptitude Test",
      category: "Aptitude",
      status: "COMPLETED",
      dueDate: "Aug 15, 2026",
      assignedBy: "Dr. Sarah Jenkins",
      unlocked: true,
      summaryText: "Submitted by student. Awaiting counselor review.",
    },
    {
      id: "asgn-3",
      title: "Big Five OCEAN Personality Trait Assessment",
      category: "Personality",
      status: "IN_PROGRESS",
      dueDate: "Aug 20, 2026",
      assignedBy: "Dr. Sarah Jenkins",
      unlocked: true,
      summaryText: "Assigned by counselor. Test in progress.",
    },
    {
      id: "asgn-4",
      title: "Work Values & Motivational Priorities Survey",
      category: "Values",
      status: "SCHEDULED",
      dueDate: "Aug 25, 2026",
      assignedBy: "Dr. Sarah Jenkins",
      unlocked: false,
      summaryText: "Locked. Unlocks automatically after Personality approval.",
    },
    {
      id: "asgn-5",
      title: "Abstract Pattern Intelligence Battery",
      category: "Intelligence",
      status: "ASSIGNED",
      dueDate: "Aug 30, 2026",
      assignedBy: "Dr. Sarah Jenkins",
      unlocked: true,
      summaryText: "Assigned by counselor. Pending student start.",
    },
  ];

  return (
    <div className="space-y-6">
      <SectionCard
        title="Counselor-Assigned Assessment Suite"
        subtitle="Generic assignment workflow across Personality, Interest, Values, Intelligence, and Aptitude"
        iconName="BookOpen"
      >
        <div className="space-y-3 pt-2">
          {displayAssignments.map((item) => {
            const definition = item.assessmentDefinitionId || {};
            const title = definition.title || item.title;
            const category = definition.category || item.category;

            return (
              <div
                key={item.id || item._id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-muted/20 transition-colors gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm text-foreground">{title}</h4>
                    <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                      {category}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Assigned by <span className="font-medium text-foreground">{item.assignedBy || "Counselor"}</span>
                    {item.dueDate && ` • Due ${item.dueDate}`}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{item.summaryText || item.counselorNotes}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <StatusBadge status={item.status} />

                  {item.status === "APPROVED" ? (
                    <Button variant="outline" size="sm" className="text-xs gap-1.5 text-emerald-600 border-emerald-600/30">
                      <ShieldCheck className="size-3.5" />
                      Approved
                    </Button>
                  ) : item.status === "COMPLETED" || item.status === "UNDER_REVIEW" ? (
                    <Button variant="secondary" size="sm" className="text-xs gap-1.5">
                      <UserCheck className="size-3.5" />
                      Counselor Review
                    </Button>
                  ) : item.unlocked === false ? (
                    <Button variant="ghost" size="sm" disabled className="text-xs gap-1.5 opacity-60">
                      <Lock className="size-3.5" />
                      Locked
                    </Button>
                  ) : (
                    <Button size="sm" className="text-xs gap-1.5">
                      <Play className="size-3.5" />
                      {item.status === "IN_PROGRESS" ? "Continue Test" : "Start Test"}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
}

export default AssessmentHistorySection;

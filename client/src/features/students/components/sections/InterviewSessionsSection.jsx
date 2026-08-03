import { SectionCard } from "@/components/common/SectionCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Video, UserCheck } from "lucide-react";

export function InterviewSessionsSection({ sessions = [] }) {
  const interviewList = sessions.length > 0 ? sessions : [
    {
      id: "sess-1",
      counselorName: "Dr. Sarah Jenkins",
      type: "Initial Career Strategy Session",
      dateTime: "Aug 5, 2026 • 2:00 PM - 3:00 PM IST",
      status: "confirmed",
      notesSummary: "Discuss high school STEM trajectory and AI specialization goals.",
    },
    {
      id: "sess-2",
      counselorName: "Marcus Vance",
      type: "University Admissions Guidance",
      dateTime: "Jul 15, 2026 • 4:00 PM - 5:00 PM IST",
      status: "completed",
      notesSummary: "Reviewed extracurricular portfolio and target computer science programs.",
    },
  ];

  return (
    <div className="space-y-6">
      <SectionCard
        title="Guidance Interview Sessions"
        subtitle="Scheduled and past one-on-one counseling consultations"
        iconName="Calendar"
      >
        <div className="space-y-4 pt-2">
          {interviewList.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-lg border border-border bg-card space-y-3 hover:border-primary/30 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">{item.counselorName}</span>
                    <span className="text-xs text-primary font-medium">• {item.type}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="size-3.5" />
                    {item.dateTime}
                  </div>
                </div>
                <StatusBadge status={item.status} />
              </div>

              {item.notesSummary && (
                <p className="text-xs text-muted-foreground bg-muted/30 p-2.5 rounded border border-border/50">
                  <span className="font-semibold text-foreground">Agenda / Notes: </span>
                  {item.notesSummary}
                </p>
              )}
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

export default InterviewSessionsSection;

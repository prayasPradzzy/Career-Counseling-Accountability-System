import { SectionCard } from "@/components/common/SectionCard";
import { Badge } from "@/components/ui/badge";
import { FileText, UserCheck, CheckCircle2 } from "lucide-react";

export function InterviewNotesSection({ notes = [] }) {
  const noteList = notes.length > 0 ? notes : [
    {
      id: "note-1",
      counselorName: "Dr. Sarah Jenkins",
      date: "Aug 1, 2026",
      topic: "Psychometric Score Interpretation & STEM Roadmap",
      content:
        "Alex demonstrated strong investigative & artistic traits (Holland RIASEC: IA). Expressed high enthusiasm for Artificial Intelligence and Software Architecture. Advised focusing on AP Computer Science and preparing a GitHub portfolio.",
      statedGoals: ["Target Top 10 Computer Science Degree Programs", "Build 2 Full-Stack Open Source Projects"],
    },
    {
      id: "note-2",
      counselorName: "Marcus Vance",
      date: "Jul 15, 2026",
      topic: "Extracurricular & Internship Readiness",
      content:
        "Reviewed academic transcript (GPA 3.8/4.0). Recommended pursuing summer research internships in machine learning data engineering.",
      statedGoals: ["Apply for University Summer Research Programs"],
    },
  ];

  return (
    <div className="space-y-6">
      <SectionCard
        title="Counselor Session Notes & Observations"
        subtitle="Documented observations, stated goals, and follow-up guidance"
        iconName="FileText"
      >
        <div className="space-y-4 pt-2">
          {noteList.map((item) => (
            <div key={item.id} className="p-4 rounded-lg border border-border bg-card space-y-3">
              <div className="flex items-center justify-between border-b border-border/50 pb-2">
                <div className="space-y-0.5">
                  <h4 className="font-semibold text-sm text-foreground">{item.topic}</h4>
                  <p className="text-xs text-muted-foreground">
                    Recorded by <span className="font-medium text-foreground">{item.counselorName}</span> on {item.date}
                  </p>
                </div>
              </div>

              <p className="text-xs text-foreground/90 leading-relaxed">{item.content}</p>

              {item.statedGoals && item.statedGoals.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    Stated Goals & Next Steps
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {item.statedGoals.map((g, i) => (
                      <Badge key={i} variant="secondary" className="text-xs py-1">
                        <CheckCircle2 className="mr-1 size-3 text-emerald-500" />
                        {g}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

export default InterviewNotesSection;

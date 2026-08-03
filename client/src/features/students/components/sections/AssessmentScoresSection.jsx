import { WidgetGrid } from "@/components/layout/WidgetGrid";
import { SectionCard } from "@/components/common/SectionCard";
import { Badge } from "@/components/ui/badge";
import { Award, Compass, Brain, Activity } from "lucide-react";

export function AssessmentScoresSection({ assessmentScores = [] }) {
  // Dimension score cards
  const riasecScores = [
    { code: "I", label: "Investigative", score: 88, desc: "High curiosity, scientific research, analytical problem solving" },
    { code: "A", label: "Artistic", score: 82, desc: "Creative expression, design thinking, unstructured problem solving" },
    { code: "R", label: "Realistic", score: 65, desc: "Hands-on tools, practical mechanics, technical execution" },
    { code: "S", label: "Social", score: 58, desc: "Helping, mentoring, interpersonal communication" },
    { code: "E", label: "Enterprising", score: 52, desc: "Leadership, persuasion, project initiative" },
    { code: "C", label: "Conventional", score: 45, desc: "Organized data, structured compliance, systematic filing" },
  ];

  const aptitudeScores = [
    { label: "Logical & Mathematical Reasoning", percentile: 94 },
    { label: "Verbal & Communication Aptitude", percentile: 88 },
    { label: "Spatial & Design Perception", percentile: 91 },
    { label: "Numerical Data Interpretation", percentile: 86 },
  ];

  return (
    <div className="space-y-6">
      {/* Holland RIASEC Score Breakdown */}
      <SectionCard
        title="Holland RIASEC Psychometric Interest Profile"
        subtitle="Primary Career Code: IA (Investigative & Artistic)"
        iconName="Compass"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {riasecScores.map((item) => (
            <div key={item.code} className="p-3.5 rounded-lg border border-border bg-card space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="font-bold">
                    {item.code}
                  </Badge>
                  <span className="font-semibold text-sm text-foreground">{item.label}</span>
                </div>
                <span className="text-xs font-bold text-primary">{item.score} / 100</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${item.score}%` }} />
              </div>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Cognitive Aptitude Percentile Benchmark */}
      <SectionCard
        title="Cognitive Aptitude Percentiles"
        subtitle="Standardized percentile ranking relative to high school/college peer benchmarks"
        iconName="Award"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {aptitudeScores.map((apt) => (
            <div key={apt.label} className="p-3.5 rounded-lg border border-border bg-card space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-xs text-foreground">{apt.label}</span>
                <Badge variant="secondary" className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {apt.percentile}th %ile
                </Badge>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${apt.percentile}%` }} />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

export default AssessmentScoresSection;

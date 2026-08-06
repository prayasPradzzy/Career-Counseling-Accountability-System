import { SectionCard } from "@/components/common/SectionCard";
import { Badge } from "@/components/ui/badge";
import { EmptyIllustration } from "@/components/common/EmptyIllustration";
import { Award, Compass } from "lucide-react";

/**
 * AssessmentScoresSection
 * Displays calculated psychometric and cognitive score benchmarks derived from real completed assessment sessions.
 * Displays EmptyIllustration when no score records exist for the student yet.
 */
export function AssessmentScoresSection({ assessmentScores = [] }) {
  if (!assessmentScores || assessmentScores.length === 0) {
    return (
      <SectionCard
        title="Assessment Scores & Psychometric Profiles"
        subtitle="Evaluated career interest & aptitude scores"
        iconName="Compass"
      >
        <EmptyIllustration
          iconName="Award"
          title="No Assessment Scores Available"
          description="This student has not completed any scored career assessments yet. Evaluated scores will appear here once assigned assessments are completed and reviewed."
          className="p-6 sm:p-8"
        />
      </SectionCard>
    );
  }

  return (
    <div className="space-y-6">
      {assessmentScores.map((scoreItem, idx) => {
        const title = scoreItem.assessmentTitle || scoreItem.title || `Assessment Score #${idx + 1}`;
        const overallCode = scoreItem.overallCode || scoreItem.primaryCode || "";
        const dimensionScores = scoreItem.dimensionScores || [];

        return (
          <SectionCard
            key={scoreItem._id || `score-${idx}`}
            title={title}
            subtitle={overallCode ? `Primary Code / Code Match: ${overallCode}` : "Dimension Breakdown"}
            iconName="Compass"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {dimensionScores.map((dim, dIdx) => {
                const label = dim.domain || dim.name || dim.label || `Dimension ${dIdx + 1}`;
                const scoreVal = dim.score ?? dim.normalizedScore ?? dim.value ?? 0;
                const desc = dim.description || dim.desc || "";
                const code = dim.code || label[0] || "D";

                return (
                  <div key={dIdx} className="p-3.5 rounded-lg border border-border bg-card space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="font-bold">
                          {code}
                        </Badge>
                        <span className="font-semibold text-sm text-foreground">{label}</span>
                      </div>
                      <span className="text-xs font-bold text-primary">{scoreVal} / 100</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, Math.max(0, scoreVal))}%` }} />
                    </div>
                    {desc && <p className="text-xs text-muted-foreground">{desc}</p>}
                  </div>
                );
              })}
            </div>
          </SectionCard>
        );
      })}
    </div>
  );
}

export default AssessmentScoresSection;

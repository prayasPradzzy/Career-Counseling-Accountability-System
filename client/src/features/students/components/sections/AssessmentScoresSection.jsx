import { SectionCard } from "@/components/common/SectionCard";
import { EmptyIllustration } from "@/components/common/EmptyIllustration";
import AssessmentResultsPanel from "@/features/assessments/components/AssessmentResultsPanel";

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
          description="This student has not completed any scored career assessments yet. Evaluated scores will appear here once assigned assessments are completed."
          className="p-6 sm:p-8"
        />
      </SectionCard>
    );
  }

  return (
    <div className="space-y-6">
      {assessmentScores.map((scoreItem, idx) => (
        <AssessmentResultsPanel
          key={scoreItem._id || `score-${idx}`}
          score={scoreItem}
          title={scoreItem.assessmentTitle || scoreItem.title || "IPIP-NEO-120 — Personality Assessment"}
          completedAt={scoreItem.computedAt || scoreItem.calculatedAt}
          statusLabel="Scored"
        />
      ))}
    </div>
  );
}

export default AssessmentScoresSection;

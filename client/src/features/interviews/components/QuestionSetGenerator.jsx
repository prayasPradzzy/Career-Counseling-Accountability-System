"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2, Sparkles } from "lucide-react";

/**
 * QuestionSetGenerator — triggers AI question generation for the
 * selected session. Disabled with an explanation when the student
 * has no completed assessments (generation is grounded in scores).
 */
export function QuestionSetGenerator({
  sessionTypeLabel,
  completedAssessmentCount,
  isGenerating,
  onGenerate,
}) {
  const noScores = completedAssessmentCount === 0;

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h4 className="text-sm font-semibold text-foreground">
            Generate Interview Questions
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            {sessionTypeLabel} · Grounded in this student&apos;s assessment profile
          </p>
        </div>
        <Button
          onClick={onGenerate}
          disabled={noScores || isGenerating}
          className="gap-1.5 text-xs font-semibold"
        >
          {isGenerating ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Sparkles className="size-3.5" />
          )}
          {isGenerating ? "Generating…" : "Generate Interview Questions"}
        </Button>
      </div>

      {noScores && (
        <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
          <AlertTriangle className="size-3.5 shrink-0" />
          This student has no completed assessments yet. Assign and complete at
          least one assessment before generating interview questions.
        </div>
      )}
    </div>
  );
}

export default QuestionSetGenerator;

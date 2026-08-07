"use client";

import { useRouter } from "next/navigation";
import { useMyAssessmentResults } from "../hooks/useAssessmentSession";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { CheckCircle2, Loader2, Clock } from "lucide-react";

/**
 * StudentResultsViewer
 *
 * Standalone component that renders the student's non-clinical "Personality Snapshot"
 * from the already-built GET /api/student/assessments/:key/results endpoint.
 *
 * Reusable from:
 * 1. Post-submission screen (inside StudentAssessmentRunner)
 * 2. "View My Results" button on the student assessments list
 *
 * Architecture: AssessmentScore (raw + band) is the only stored source of truth.
 * Friendly text is generated at request time from studentInterpretations.json.
 * No duplicate rendered copy is stored.
 */
export default function StudentResultsViewer({
  assessmentKey = "ipip-neo-120",
  definitionTitle,
  completedAt,
  onBack,
}) {
  const router = useRouter();
  const { data, isLoading, error } = useMyAssessmentResults(assessmentKey);
  const results = data?.data || {};
  const insights = results.insights || [];

  return (
    <div className="max-w-2xl mx-auto my-8 space-y-6">
      <Card className="border-emerald-500/40 shadow-lg bg-card overflow-hidden">
        <div className="bg-emerald-600 h-2 w-full" />
        <CardHeader className="pt-8 pb-4 space-y-3 text-center">
          <div className="mx-auto size-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="size-10" />
          </div>
          <CardTitle className="text-2xl font-bold">Your Personality Snapshot</CardTitle>
          <CardDescription className="text-sm max-w-md mx-auto">
            Insights based on your responses to the {results.assessmentName || definitionTitle || "Personality Assessment"}.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pb-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-3">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Generating your personality insights...</p>
            </div>
          ) : error || insights.length === 0 ? (
            <div className="p-5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center space-y-2">
              <Clock className="size-8 text-amber-500 mx-auto animate-pulse" />
              <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                Your results are still being processed
              </p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                Your responses have been securely saved. Personality insights are currently being generated — check back shortly or refresh this page.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {insights.map((insight, idx) => (
                <div
                  key={insight.code || idx}
                  className="p-4 rounded-xl bg-muted/30 border border-border/60 space-y-1.5 transition-all hover:bg-muted/50 text-left"
                >
                  <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                    <span className="size-2 rounded-full bg-primary shrink-0" />
                    {insight.label}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed pl-4">
                    {insight.text}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="text-center text-[11px] text-muted-foreground pt-2">
            Submitted on {formatSubmittedTime(completedAt || results.completedAt)}
          </div>
        </CardContent>

        <CardFooter className="bg-muted/20 border-t p-4">
          <Button
            className="w-full font-semibold"
            onClick={() => (onBack ? onBack() : router.push("/assessments"))}
          >
            Return to Assessments
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

function formatSubmittedTime(dateStr) {
  if (!dateStr) return new Date().toLocaleTimeString();
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

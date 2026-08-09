"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, AlertCircle, Loader2 } from "lucide-react";

/**
 * Shared ConfirmSubmissionModal Component
 * Parameterized by assessment type (checkbox vs likert).
 */
export default function ConfirmSubmissionModal({
  open,
  onClose,
  onSubmit,
  isSubmitting = false,
  responseType = "likert",
  stats = { answeredCount: 0, totalQuestions: 0, selectedCount: 0, timeSpentSeconds: 0 },
}) {
  if (!open) return null;

  const isCheckbox = responseType === "checkbox";
  const { answeredCount = 0, totalQuestions = 0, selectedCount = 0, timeSpentSeconds = 0 } = stats;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const isLikertIncomplete = !isCheckbox && answeredCount < totalQuestions;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-border/80 shadow-2xl bg-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
            <ShieldCheck className="size-5 text-primary shrink-0" /> Confirm Submission
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground leading-relaxed pt-1">
            {isCheckbox
              ? "Ready to submit your Interest Profiler responses? Once submitted, your answers cannot be changed."
              : "Are you sure you want to submit your assessment? Once submitted, your answers cannot be changed."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-0 pb-6">
          {/* Stats Summary Box */}
          <div className="p-3.5 rounded-lg bg-muted/50 border border-border/60 text-xs space-y-2">
            {isCheckbox ? (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground font-medium">Activities selected:</span>
                <span className="font-semibold text-foreground text-sm tabular-nums">
                  {selectedCount} of {totalQuestions}
                </span>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground font-medium">Answered:</span>
                <span className="font-semibold text-foreground text-sm tabular-nums">
                  {answeredCount} of {totalQuestions}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center pt-1 border-t border-border/40">
              <span className="text-muted-foreground font-medium">Time spent:</span>
              <span className="font-semibold text-foreground text-sm tabular-nums">
                {formatTime(timeSpentSeconds)}
              </span>
            </div>
          </div>

          {/* Unanswered warning box (Likert-type ONLY) */}
          {isLikertIncomplete && (
            <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2.5 leading-snug">
              <AlertCircle className="size-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <span>You have unanswered questions. Missing answers will be submitted as incomplete.</span>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex items-center justify-end gap-3 border-t border-border/60 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 font-medium"
          >
            Continue Answering
          </Button>

          <Button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="px-6 py-2.5 font-bold shadow-md bg-primary hover:bg-primary/90 text-primary-foreground transition-all"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" /> Submitting...
              </>
            ) : (
              "Submit Responses"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

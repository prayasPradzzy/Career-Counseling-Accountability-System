"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAutosaveProgress, useSubmitSession } from "../hooks/useAssessmentSession";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  ArrowRight,
  Lock,
} from "lucide-react";
import { toast } from "sonner";

// ── Scale label definitions ────────────────────────────────────────────────
const SCALE_LABELS = {
  5: "Most Important",
  4: "Important",
  3: "Somewhat Important",
  2: "Slightly Important",
  1: "Least Important",
};

const COLUMN_COLORS = {
  5: { bg: "bg-violet-600", hover: "hover:bg-violet-700", ring: "ring-violet-400", light: "bg-violet-50 dark:bg-violet-950/30", border: "border-violet-300 dark:border-violet-700", text: "text-violet-700 dark:text-violet-300" },
  4: { bg: "bg-blue-600", hover: "hover:bg-blue-700", ring: "ring-blue-400", light: "bg-blue-50 dark:bg-blue-950/30", border: "border-blue-300 dark:border-blue-700", text: "text-blue-700 dark:text-blue-300" },
  3: { bg: "bg-emerald-600", hover: "hover:bg-emerald-700", ring: "ring-emerald-400", light: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-300 dark:border-emerald-700", text: "text-emerald-700 dark:text-emerald-300" },
  2: { bg: "bg-amber-500", hover: "hover:bg-amber-600", ring: "ring-amber-400", light: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-300 dark:border-amber-700", text: "text-amber-700 dark:text-amber-300" },
  1: { bg: "bg-slate-500", hover: "hover:bg-slate-600", ring: "ring-slate-400", light: "bg-slate-50 dark:bg-slate-800/40", border: "border-slate-300 dark:border-slate-600", text: "text-slate-700 dark:text-slate-300" },
};

const ITEMS_PER_COLUMN = 4;
const TOTAL_ITEMS = 20;

/**
 * ForcedRankSortRunner
 *
 * Renders the O*NET Work Importance Locator card-sort UI.
 * Students assign each of the 20 work value cards to exactly one
 * importance level (1–5), with a hard constraint of exactly 4 cards
 * per level. Submission is gated until all 20 are placed and each
 * column has exactly 4.
 *
 * Attribution: O*NET™ is a trademark of the U.S. Department of Labor,
 * Employment and Training Administration. Version 3.0 (Retired June 3, 2024).
 * Used under CC-BY 4.0.
 */
export default function ForcedRankSortRunner({
  sessionId,
  session,
  questions,
  initialAnswers,
  timeSpent,
  onSubmitComplete,
}) {
  const [ratings, setRatings] = useState(() => {
    // Pre-populate from saved responses
    const init = {};
    for (const q of questions) {
      if (initialAnswers[q.id] !== null && initialAnswers[q.id] !== undefined) {
        init[q.id] = Number(initialAnswers[q.id]);
      }
    }
    return init;
  });

  const [saveStatus, setSaveStatus] = useState("saved");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const autosaveMutation = useAutosaveProgress();
  const submitMutation = useSubmitSession();
  const autosaveTimerRef = useRef(null);

  // ── Column counts ─────────────────────────────────────────────────────────
  const columnCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const val of Object.values(ratings)) {
    if (val >= 1 && val <= 5) columnCounts[val]++;
  }

  const totalRated = Object.keys(ratings).length;
  const allColumnsExact = Object.values(columnCounts).every((c) => c === ITEMS_PER_COLUMN);
  const canSubmit = totalRated === TOTAL_ITEMS && allColumnsExact;

  // ── Autosave ──────────────────────────────────────────────────────────────
  const triggerAutosave = useCallback(
    (newRatings) => {
      setSaveStatus("saving");
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);

      autosaveTimerRef.current = setTimeout(async () => {
        try {
          const payloadResponses = Object.entries(newRatings).map(([questionId, selectedValue]) => {
            const qObj = questions.find((q) => q.id === questionId);
            return {
              questionId,
              questionNumber: qObj ? qObj.questionNumber : 0,
              selectedValue,
            };
          });

          await autosaveMutation.mutateAsync({
            sessionId,
            payload: {
              responses: payloadResponses,
              timeSpentSeconds: timeSpent,
              currentQuestionIndex: 0,
            },
          });
          setSaveStatus("saved");
        } catch {
          setSaveStatus("unsaved");
          toast.error("Autosave failed. Changes are held locally.");
        }
      }, 800);
    },
    [sessionId, questions, timeSpent, autosaveMutation]
  );

  // ── Handle rating assignment ───────────────────────────────────────────────
  const handleRate = (questionId, column) => {
    if (session?.status !== "in_progress") {
      toast.error("Session is locked. Responses cannot be modified.");
      return;
    }

    setRatings((prev) => {
      const next = { ...prev, [questionId]: column };
      triggerAutosave(next);
      return next;
    });
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      await submitMutation.mutateAsync(sessionId);
      toast.success("Assessment submitted successfully!");
      onSubmitComplete?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to submit assessment.");
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">

      {/* ── Sticky header: column counters + controls ───────────────────────── */}
      <div className="sticky top-16 z-20 bg-background/95 backdrop-blur border border-border/80 rounded-xl shadow-md overflow-hidden">
        {/* Column counter row */}
        <div className="grid grid-cols-5 border-b border-border/60">
          {[5, 4, 3, 2, 1].map((col) => {
            const count = columnCounts[col];
            const full = count === ITEMS_PER_COLUMN;
            const colors = COLUMN_COLORS[col];
            return (
              <div
                key={col}
                className={`p-3 text-center transition-colors ${full ? colors.light : "bg-muted/20"}`}
              >
                <div className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${full ? colors.text : "text-muted-foreground"}`}>
                  {SCALE_LABELS[col]}
                </div>
                <div className={`text-lg font-bold font-mono tabular-nums ${full ? colors.text : "text-foreground"}`}>
                  {count}<span className="text-xs font-normal opacity-60">/4</span>
                </div>
                {full && (
                  <div className={`flex items-center justify-center gap-0.5 mt-0.5 text-[10px] font-semibold ${colors.text}`}>
                    <CheckCircle2 className="size-3" /> Full
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Progress row */}
        <div className="px-4 py-2.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs">
            <span className="font-medium text-muted-foreground">
              <span className="text-foreground font-bold tabular-nums">{totalRated}</span>
              {" "}of {TOTAL_ITEMS} cards placed
            </span>
            {/* 20-dot progress indicator */}
            <div className="hidden sm:flex gap-0.5">
              {questions.map((q) => {
                const rating = ratings[q.id];
                const color = rating ? COLUMN_COLORS[rating].bg : "bg-muted";
                return (
                  <span key={q.id} className={`inline-block size-2 rounded-full transition-colors ${color}`} />
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Autosave indicator */}
            <div className="flex items-center gap-1.5 text-xs font-medium">
              {saveStatus === "saving" && (
                <><Loader2 className="size-3.5 animate-spin text-amber-500" /><span className="text-amber-600">Saving...</span></>
              )}
              {saveStatus === "saved" && (
                <><CheckCircle2 className="size-3.5 text-emerald-600" /><span className="text-emerald-700">Saved</span></>
              )}
              {saveStatus === "unsaved" && (
                <><AlertCircle className="size-3.5 text-destructive" /><span className="text-destructive">Unsaved</span></>
              )}
            </div>

            {/* Timer */}
            <div className="flex items-center gap-1 px-2.5 py-1 rounded bg-muted font-mono text-xs font-semibold">
              <Clock className="size-3.5 text-primary" />
              <span>{formatTime(timeSpent)}</span>
            </div>

            {/* Submit */}
            <Button
              id="wil-submit-btn"
              disabled={!canSubmit || isSubmitting}
              onClick={handleSubmit}
              className={`text-xs font-bold px-4 h-8 transition-all ${
                canSubmit
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
                  : "opacity-50"
              }`}
            >
              {isSubmitting ? (
                <><Loader2 className="size-3.5 mr-1.5 animate-spin" /> Submitting...</>
              ) : canSubmit ? (
                <>Submit <ArrowRight className="size-3.5 ml-1" /></>
              ) : (
                <><Lock className="size-3.5 mr-1" /> {TOTAL_ITEMS - totalRated} remaining</>
              )}
            </Button>
          </div>
        </div>

        {/* Gate message */}
        {!canSubmit && totalRated > 0 && (
          <div className="px-4 pb-2.5 text-[11px] text-muted-foreground">
            {totalRated < TOTAL_ITEMS
              ? `Place ${TOTAL_ITEMS - totalRated} more card${TOTAL_ITEMS - totalRated !== 1 ? "s" : ""} to unlock submission.`
              : "Each level must have exactly 4 cards. Adjust any over- or under-filled levels."}
          </div>
        )}
      </div>

      {/* ── Card list ─────────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {questions.map((q, idx) => {
          const currentRating = ratings[q.id];
          const isRated = currentRating !== undefined;
          const colors = isRated ? COLUMN_COLORS[currentRating] : null;

          return (
            <Card
              key={q.id}
              id={`wil-card-${q.id}`}
              className={`transition-all border-2 ${
                isRated
                  ? `${colors.border} shadow-sm`
                  : "border-border/60 hover:border-border"
              }`}
            >
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  {/* Card number + text */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span
                      className={`flex items-center justify-center size-7 rounded-full text-xs font-bold shrink-0 transition-colors ${
                        isRated
                          ? `${colors.bg} text-white`
                          : "bg-primary/10 text-primary"
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <p className="text-sm font-medium leading-snug text-foreground pt-0.5">
                      {q.text}
                    </p>
                  </div>

                  {/* Rating buttons */}
                  <div className="flex gap-1.5 shrink-0 sm:ml-auto">
                    {[5, 4, 3, 2, 1].map((col) => {
                      const isSelected = currentRating === col;
                      const isFull = columnCounts[col] === ITEMS_PER_COLUMN && !isSelected;
                      const btnColors = COLUMN_COLORS[col];

                      return (
                        <button
                          key={col}
                          id={`wil-card-${q.id}-col-${col}`}
                          type="button"
                          disabled={isFull}
                          onClick={() => handleRate(q.id, col)}
                          title={`${SCALE_LABELS[col]}${isFull ? " (full — 4/4 used)" : ""}`}
                          className={`flex flex-col items-center justify-center w-14 sm:w-16 py-2 rounded-lg border text-center transition-all ${
                            isSelected
                              ? `${btnColors.bg} text-white border-transparent ring-2 ${btnColors.ring}/40 shadow font-bold`
                              : isFull
                              ? "opacity-30 cursor-not-allowed bg-muted border-border/40 text-muted-foreground"
                              : `bg-background hover:${btnColors.light} border-border/60 hover:border-current text-foreground cursor-pointer`
                          }`}
                        >
                          <span className="text-xs font-bold leading-none">{col}</span>
                          <span className="text-[9px] leading-tight mt-0.5 opacity-80 max-w-[54px] text-center hidden sm:block">
                            {SCALE_LABELS[col]}
                          </span>
                          {isFull && !isSelected && (
                            <Lock className="size-2.5 mt-0.5 opacity-50" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selected label pill */}
                {isRated && (
                  <div className="mt-2 flex items-center gap-1.5 pl-10">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${colors.light} ${colors.text}`}>
                      <CheckCircle2 className="size-3" />
                      {SCALE_LABELS[currentRating]}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── O*NET Attribution Footer ──────────────────────────────────────────── */}
      <div className="mt-8 pt-4 border-t border-border/40 text-center space-y-1">
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          <span className="font-semibold">O*NET™</span> is a trademark of the U.S. Department of Labor, Employment and Training Administration.{" "}
          Work Importance Locator, Version 3.0 (retired June 3, 2024). Used for research purposes under CC-BY 4.0.
        </p>
        <p className="text-[10px] text-muted-foreground/60">
          Source: U.S. Department of Labor, Employment and Training Administration. O*NET Work Importance Locator, Version 3.0.
          Archived materials provided "AS IS" for research purposes only.
        </p>
      </div>
    </div>
  );
}

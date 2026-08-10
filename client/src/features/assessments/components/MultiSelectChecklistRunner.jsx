"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  useAutosaveProgress,
  useSubmitSession,
} from "../hooks/useAssessmentSession";
import ConfirmSubmissionModal from "./ConfirmSubmissionModal";
import AssessmentProgressHeader from "./AssessmentProgressHeader";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Sparkles, Send } from "lucide-react";
import { toast } from "sonner";

/**
 * Deterministic shuffle using a seed derived from session ID.
 * Ensures the same student sees the same order on resume, but
 * the order is decoupled from category grouping.
 */
function seededShuffle(array, seed) {
  const arr = [...array];
  let s = 0;
  for (let i = 0; i < seed.length; i++) {
    s = ((s << 5) - s + seed.charCodeAt(i)) | 0;
  }
  // Simple xorshift-style PRNG
  const next = () => {
    s ^= s << 13;
    s ^= s >> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * MultiSelectChecklistRunner
 *
 * Canonical UI for checkbox-type assessments (e.g., O*NET Interest Profiler).
 * Displays all items as a scrollable grid of tappable cards with no category
 * information exposed to the student. Items are shuffled to prevent category-bias.
 *
 * Props:
 *  - sessionId: string
 *  - session: object (session state from backend)
 *  - questions: array (all assessment questions)
 *  - initialAnswers: object { questionId → 0|1 }
 *  - timeSpent: number (seconds already spent, for display continuity)
 *  - onSubmitComplete: () => void
 */
export default function MultiSelectChecklistRunner({
  sessionId,
  session,
  questions,
  initialAnswers,
  timeSpent: initialTimeSpent,
  onSubmitComplete,
}) {
  const definition = session?.assessmentDefinitionId;
  const totalQuestions = questions.length;

  // ── State ─────────────────────────────────────────────────────────────────
  const [answers, setAnswers] = useState(() => {
    // Initialize all questions to 0 (unselected), then overlay saved responses
    const base = {};
    questions.forEach((q) => {
      base[q.id] = 0;
    });
    return { ...base, ...initialAnswers };
  });
  const [saveStatus, setSaveStatus] = useState("saved");
  const [timeSpent, setTimeSpent] = useState(initialTimeSpent || 0);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  const autosaveMutation = useAutosaveProgress();
  const submitMutation = useSubmitSession();
  const autosaveTimerRef = useRef(null);

  // ── Shuffled question order (deterministic per session) ───────────────────
  const shuffledQuestions = useMemo(
    () => seededShuffle(questions, sessionId || "default"),
    [questions, sessionId]
  );

  // ── Timer ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSpent((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // ── Derived counts ────────────────────────────────────────────────────────
  const selectedCount = Object.values(answers).filter(
    (v) => v === 1 || v === true
  ).length;

  // ── Format time (MM:SS) for the footer ────────────────────────────────────
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // ── Autosave ──────────────────────────────────────────────────────────────
  const triggerAutosave = useCallback(
    (newAnswers) => {
      setSaveStatus("saving");
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);

      autosaveTimerRef.current = setTimeout(async () => {
        try {
          const payloadResponses = Object.entries(newAnswers).map(
            ([questionId, selectedValue]) => {
              const qObj = questions.find((q) => q.id === questionId);
              return {
                questionId,
                questionNumber: qObj?.questionNumber || 0,
                selectedValue,
              };
            }
          );

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
          toast.error("Autosave failed. Will retry on next selection.");
        }
      }, 500);
    },
    [sessionId, questions, timeSpent, autosaveMutation]
  );

  // ── Toggle a card ─────────────────────────────────────────────────────────
  const handleToggle = (questionId) => {
    if (
      session?.status !== "in_progress" &&
      session?.status !== "not_started"
    ) {
      toast.error("Session is locked.");
      return;
    }

    const currentVal = answers[questionId];
    const isChecked = currentVal === 1 || currentVal === true;
    const newAnswers = { ...answers, [questionId]: isChecked ? 0 : 1 };
    setAnswers(newAnswers);
    triggerAutosave(newAnswers);
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    try {
      // Final save before submit
      const payloadResponses = Object.entries(answers).map(
        ([questionId, selectedValue]) => {
          const qObj = questions.find((q) => q.id === questionId);
          return {
            questionId,
            questionNumber: qObj?.questionNumber || 0,
            selectedValue,
          };
        }
      );

      await autosaveMutation.mutateAsync({
        sessionId,
        payload: {
          responses: payloadResponses,
          timeSpentSeconds: timeSpent,
          currentQuestionIndex: 0,
        },
      });

      await submitMutation.mutateAsync(sessionId);
      toast.success("Assessment submitted successfully!");
      setIsSubmitModalOpen(false);
      onSubmitComplete?.();
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to submit assessment."
      );
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto space-y-0 pb-16">
      {/* ─── Sticky Counter Header (shared component) ─────────────────────── */}
      <AssessmentProgressHeader
        title={definition?.title || "Interest Profiler"}
        icon={Sparkles}
        progressText={
          <>
            <span className="font-semibold text-foreground tabular-nums text-base">
              {selectedCount}
            </span>{" "}
            {selectedCount === 1 ? "activity" : "activities"} selected
            <span className="text-muted-foreground/60 ml-1">
              of {totalQuestions} total
            </span>
          </>
        }
        progressValue={Math.round((selectedCount / Math.max(1, totalQuestions)) * 100)}
        saveStatus={saveStatus}
        timeSpent={timeSpent}
        className="mb-6"
      />

      {/* ─── Instruction Banner ───────────────────────────────────────────── */}
      <div className="mx-auto mb-6 p-4 rounded-xl border border-primary/20 bg-primary/5 text-center">
        <p className="text-sm text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground">
            Tap each activity you&apos;d enjoy doing.
          </span>{" "}
          There are no right or wrong answers — select as many or as few as
          genuinely interest you.
        </p>
      </div>

      {/* ─── Activity Cards Grid ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {shuffledQuestions.map((q) => {
          const isSelected =
            answers[q.id] === 1 || answers[q.id] === true;

          return (
            <button
              key={q.id}
              type="button"
              onClick={() => handleToggle(q.id)}
              className={`
                group relative text-left w-full rounded-xl border-2 p-4 
                transition-all duration-200 ease-out cursor-pointer
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50
                ${
                  isSelected
                    ? "border-emerald-500 bg-emerald-500/10 shadow-md shadow-emerald-500/10 hover:bg-emerald-500/15"
                    : "border-border/60 bg-card hover:border-primary/40 hover:bg-muted/50 hover:shadow-sm"
                }
              `}
            >
              {/* Checkmark indicator */}
              <div
                className={`
                  absolute top-3 right-3 size-6 rounded-full flex items-center justify-center
                  transition-all duration-200
                  ${
                    isSelected
                      ? "bg-emerald-500 text-white scale-100"
                      : "border-2 border-border/80 bg-background scale-90 group-hover:scale-100 group-hover:border-primary/40"
                  }
                `}
              >
                {isSelected && <CheckCircle2 className="size-4" />}
              </div>

              {/* Activity text */}
              <p
                className={`
                  text-sm leading-relaxed pr-8
                  transition-colors duration-200
                  ${
                    isSelected
                      ? "text-foreground font-medium"
                      : "text-muted-foreground group-hover:text-foreground"
                  }
                `}
              >
                {q.text}
              </p>
            </button>
          );
        })}
      </div>

      {/* ─── Submit Footer ────────────────────────────────────────────────── */}
      <div className="mt-8 pt-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground">
          You&apos;ve selected{" "}
          <span className="font-semibold text-foreground tabular-nums">
            {selectedCount}
          </span>{" "}
          of {totalQuestions} activities •{" "}
          <span className="font-mono">{formatTime(timeSpent)}</span> elapsed
        </p>

        <Button
          size="lg"
          className="font-bold px-8 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md gap-2"
          onClick={() => setIsSubmitModalOpen(true)}
        >
          <Send className="size-4" />
          Submit Assessment
        </Button>
      </div>

      {/* ─── Confirm Modal ────────────────────────────────────────────────── */}
      <ConfirmSubmissionModal
        open={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onSubmit={handleSubmit}
        isSubmitting={submitMutation.isPending}
        responseType="checkbox"
        stats={{
          answeredCount: totalQuestions,
          totalQuestions,
          selectedCount,
          timeSpentSeconds: timeSpent,
        }}
      />
    </div>
  );
}

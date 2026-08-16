"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  useSessionState,
  useSessionQuestions,
  useAutosaveProgress,
  useSubmitSession,
} from "../hooks/useAssessmentSession";
import StudentResultsViewer from "./StudentResultsViewer";
import ConfirmSubmissionModal from "./ConfirmSubmissionModal";
import ForcedRankSortRunner from "./ForcedRankSortRunner";
import MultiSelectChecklistRunner from "./MultiSelectChecklistRunner";
import AssessmentProgressHeader from "./AssessmentProgressHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import {
  CheckCircle2,
  Clock,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  Save,
  Lock,
  BookOpen,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

export default function StudentAssessmentRunner({
  sessionId,
  onBack,
  nextAssignment = null,
  onContinueToNext,
}) {
  const router = useRouter();

  // Queries & Mutations
  const { data: stateData, isLoading: stateLoading, refetch: refetchState } = useSessionState(sessionId);
  const { data: questionsData, isLoading: questionsLoading } = useSessionQuestions(sessionId);

  const autosaveMutation = useAutosaveProgress();
  const submitMutation = useSubmitSession();

  // Local Runner States
  const [viewMode, setViewMode] = useState("INSTRUCTIONS"); // INSTRUCTIONS | RUNNER | COMPLETION
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [focusedQuestionId, setFocusedQuestionId] = useState(null);
  const [answers, setAnswers] = useState({}); // questionId -> selectedValue
  const [saveStatus, setSaveStatus] = useState("saved"); // saved | saving | unsaved
  const [timeSpent, setTimeSpent] = useState(0);
  const [isSubmittingModalOpen, setIsSubmittingModalOpen] = useState(false);

  // Refs for sticky header height measurement and first-question scroll target
  const headerRef = useRef(null);
  const firstQuestionRef = useRef(null);

  // Scroll to the first question of the current section, landing it just below
  // the sticky header. The page scrolls inside <main>, so we compute the offset
  // from the measured header height rather than relying on scroll-margin (which
  // Chrome ignores for nested scroll containers). Each question card also keeps
  // a scroll-margin-top as a secondary cue for native scrolls.
  const scrollToFirstQuestion = useCallback(() => {
    // Use requestAnimationFrame to wait for DOM to paint the new section
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = firstQuestionRef.current;
        if (!el) return;
        const main = el.closest("main");
        if (!main) return;
        const headerHeight = headerRef.current?.offsetHeight ?? 200;
        const top = el.getBoundingClientRect().top - main.getBoundingClientRect().top - headerHeight - 16;
        main.scrollTo({ top: main.scrollTop + top, behavior: "smooth" });
      });
    });
  }, []);

  const session = stateData?.data?.session;
  const definition = session?.assessmentDefinitionId;

  const sections = questionsData?.data?.sections || [];
  const questions = questionsData?.data?.questions || [];

  // Populate local answers from backend response data once loaded
  useEffect(() => {
    if (questions.length > 0) {
      const isCheckbox = definition?.responseType === "checkbox";
      const initialAnswers = {};
      questions.forEach((q) => {
        if (q.savedResponse !== null && q.savedResponse !== undefined) {
          initialAnswers[q.id] = q.savedResponse;
        } else if (isCheckbox) {
          initialAnswers[q.id] = 0;
        }
      });
      setAnswers(initialAnswers);
    }
  }, [questions, definition]);

  // Sync session time spent and initial mode
  useEffect(() => {
    if (session) {
      setTimeSpent(session.timeSpentSeconds || 0);
      if (
        session.status === "completed" ||
        session.status === "submitted" ||
        session.status === "reviewed" ||
        session.status === "approved"
      ) {
        setViewMode("COMPLETION");
      } else if (session.status === "in_progress" && (session.progress?.answeredCount > 0 || session.progress?.percentage > 0)) {
        setViewMode("RUNNER");
      }
    }
  }, [session]);

  // Timer for time spent tracking
  useEffect(() => {
    if (viewMode !== "RUNNER") return;
    const interval = setInterval(() => {
      setTimeSpent((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [viewMode]);

  // Debounced Autosave function
  const autosaveTimerRef = useRef(null);

  const triggerAutosave = useCallback(
    (newAnswers, qId, val) => {
      setSaveStatus("saving");

      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }

      autosaveTimerRef.current = setTimeout(async () => {
        try {
          const payloadResponses = Object.entries(newAnswers).map(([questionId, selectedValue]) => {
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
              currentQuestionIndex: activeSectionIndex,
            },
          });

          setSaveStatus("saved");
        } catch (err) {
          setSaveStatus("unsaved");
          toast.error("Autosave failed. Retrying on next selection...");
        }
      }, 600);
    },
    [sessionId, questions, timeSpent, activeSectionIndex, autosaveMutation]
  );

  // Handle Option Selection
  const handleSelectOption = (questionId, value) => {
    if (session?.status !== "in_progress" && viewMode === "RUNNER" && session?.status) {
      toast.error("Session is locked. Responses cannot be modified.");
      return;
    }

    const updatedAnswers = { ...answers, [questionId]: value };
    setAnswers(updatedAnswers);
    triggerAutosave(updatedAnswers, questionId, value);
  };

  // Active section questions (30 questions per section as per backend sections)
  const currentSection = sections[activeSectionIndex] || { title: "Assessment Questions", questionStart: 1, questionEnd: 120 };
  const currentSectionQuestions = questions.filter(
    (q) =>
      !sections.length ||
      (q.questionNumber >= (currentSection.questionStart || 1) &&
        q.questionNumber <= (currentSection.questionEnd || 120))
  );

  // Answered Count & Selected Count calculation
  const isCheckbox = definition?.responseType === "checkbox";
  const totalQuestionsCount = questions.length || 120;
  const selectedCount = Object.values(answers).filter(
    (val) => val === 1 || val === true
  ).length;
  const answeredCount = isCheckbox
    ? totalQuestionsCount
    : Object.keys(answers).filter(
        (k) => answers[k] !== null && answers[k] !== undefined && answers[k] !== ""
      ).length;
  const progressPercentage = Math.round((answeredCount / Math.max(1, totalQuestionsCount)) * 100);

  // Keyboard navigation shortcuts (1-5 for Likert values)
  useEffect(() => {
    if (viewMode !== "RUNNER") return;

    const handleKeyDown = (e) => {
      // 1-5 keys for option selection when focused on a question
      if (["1", "2", "3", "4", "5"].includes(e.key) && focusedQuestionId) {
        handleSelectOption(focusedQuestionId, Number(e.key));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewMode, focusedQuestionId, handleSelectOption]);

  // Handle Final Submission
  const handleSubmitAssessment = async () => {
    try {
      await submitMutation.mutateAsync(sessionId);
      toast.success("Assessment submitted successfully!");
      setViewMode("COMPLETION");
      setIsSubmittingModalOpen(false);
      refetchState();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to submit assessment.");
    }
  };

  if (stateLoading || questionsLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="size-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-medium">Loading assessment environment...</p>
      </div>
    );
  }

  // ============================================================
  // VIEW 1: INSTRUCTIONS & START SCREEN
  // ============================================================
  if (viewMode === "INSTRUCTIONS") {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Button variant="ghost" onClick={onBack} className="mb-2">
          <ArrowLeft className="mr-2 size-4" /> Back to Assessments
        </Button>

        <Card className="border-border/80 shadow-md">
          <CardHeader className="space-y-3 border-b border-border/50 pb-6">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="uppercase font-mono text-xs tracking-wider">
                {definition?.category || "Personality Assessment"}
              </Badge>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="size-4 text-primary" />
                <span>Est. ~{definition?.estimatedDuration || 5} min</span>
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">{definition?.title || "IPIP-NEO-120 Assessment"}</CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              {definition?.description || "120-item measure of the Five-Factor Model of Personality."}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 pt-6">
            {/* Instructions Box */}
            <div className="p-4 rounded-lg bg-muted/40 border border-border/60 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <BookOpen className="size-4 text-primary" />
                <span>Assessment Instructions</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {definition?.instructions || "Please rate how accurately each statement describes you. Answer honestly — there are no right or wrong answers."}
              </p>
            </div>

            {/* Structure Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-md border border-border/50 bg-background flex items-center gap-3">
                <HelpCircle className="size-5 text-primary shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">Total Questions</div>
                  <div className="text-sm font-semibold">{totalQuestionsCount} Items</div>
                </div>
              </div>

              <div className="p-3.5 rounded-md border border-border/50 bg-background flex items-center gap-3">
                <Save className="size-5 text-emerald-5-500 shrink-0 text-emerald-600" />
                <div>
                  <div className="text-xs text-muted-foreground">Autosave Engine</div>
                  <div className="text-sm font-semibold">Automatic Progress Resume</div>
                </div>
              </div>
            </div>

            {/* Sections List */}
            {sections.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Assessment Structure</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {sections.map((sec) => (
                    <div key={sec.id} className="p-3 rounded border border-border/40 text-xs flex justify-between items-center">
                      <span className="font-medium">{sec.title}</span>
                      <span className="text-muted-foreground">Q{sec.questionStart}–{sec.questionEnd}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="border-t border-border/50 pt-6 flex justify-between">
            <Button variant="outline" onClick={onBack}>
              Cancel
            </Button>
            <Button
              className="font-semibold px-8 shadow"
              onClick={() => setViewMode("RUNNER")}
            >
              {answeredCount > 0 ? "Resume Assessment" : "Start Assessment"}
              <ArrowRight className="ml-2 size-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // ============================================================
  // VIEW 2: INTERACTIVE ASSESSMENT RUNNER
  // ============================================================
  if (viewMode === "RUNNER") {
    // ── Forced-Rank Sort branch (O*NET WIL) ─────────────────────────────────
    if (definition?.responseType === "forced-rank-sort") {
      return (
        <ForcedRankSortRunner
          sessionId={sessionId}
          session={session}
          questions={questions}
          initialAnswers={answers}
          timeSpent={timeSpent}
          onSubmitComplete={() => {
            setViewMode("COMPLETION");
            refetchState();
          }}
        />
      );
    }

    // ── Multi-Select Checklist branch (O*NET Interest Profiler, checkbox type) ─
    if (definition?.responseType === "checkbox") {
      return (
        <MultiSelectChecklistRunner
          sessionId={sessionId}
          session={session}
          questions={questions}
          initialAnswers={answers}
          timeSpent={timeSpent}
          onSubmitComplete={() => {
            setViewMode("COMPLETION");
            refetchState();
          }}
        />
      );
    }

    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        {/* Sticky Header — shared component, sits flush below the app top nav bar */}
        <AssessmentProgressHeader
          ref={headerRef}
          title={definition?.title || "Assessment"}
          badge={currentSection.title}
          progressText={`${answeredCount} of ${totalQuestionsCount} questions answered (${progressPercentage}%)`}
          progressValue={progressPercentage}
          saveStatus={saveStatus}
          timeSpent={timeSpent}
          footer={
            sections.length > 1 && (
              <div className="px-4 pb-3 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {sections.map((sec, idx) => {
                  const isActive = idx === activeSectionIndex;
                  const secQuestions = questions.filter(
                    (q) => q.questionNumber >= sec.questionStart && q.questionNumber <= sec.questionEnd
                  );
                  const secAnswered = secQuestions.filter((q) => answers[q.id] !== undefined && answers[q.id] !== null).length;
                  const isSecComplete = secQuestions.length > 0 && secAnswered === secQuestions.length;

                  return (
                    <button
                      key={sec.id}
                      onClick={() => {
                        setActiveSectionIndex(idx);
                        scrollToFirstQuestion();
                      }}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold shrink-0 transition-colors flex items-center gap-1.5 border ${
                        isActive
                          ? "bg-primary text-primary-foreground border-primary"
                          : isSecComplete
                          ? "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300"
                          : "bg-muted/50 hover:bg-muted text-muted-foreground border-border/50"
                      }`}
                    >
                      {isSecComplete && <CheckCircle2 className="size-3 shrink-0" />}
                      <span>{sec.title}</span>
                      <span className="text-[10px] opacity-80">({secAnswered}/{secQuestions.length})</span>
                    </button>
                  );
                })}
              </div>
            )
          }
        />

        {/* Section Description Header */}
        <div className="p-4 rounded-lg bg-muted/30 border border-border/50 flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-sm">{currentSection.title}</h4>
            <p className="text-xs text-muted-foreground">
              {currentSection.description || `Answer all statements from Q${currentSection.questionStart} to Q${currentSection.questionEnd}.`}
            </p>
          </div>
          <div className="text-xs text-muted-foreground font-mono">
            Showing {currentSectionQuestions.length} Items
          </div>
        </div>

        {/* Questions List (Rendered dynamically from backend) */}
        <div className="space-y-4">
          {currentSectionQuestions.map((q, qIdx) => {
            const isAnswered = answers[q.id] !== undefined && answers[q.id] !== null;
            const isFocused = focusedQuestionId === q.id;

            return (
              <Card
                key={q.id}
                ref={qIdx === 0 ? firstQuestionRef : undefined}
                tabIndex={0}
                onFocus={() => setFocusedQuestionId(q.id)}
                style={{ scrollMarginTop: `calc(${headerRef.current?.offsetHeight ?? 120}px + 16px)` }}
                className={`transition-all border ${
                  isFocused
                    ? "ring-2 ring-primary/40 border-primary shadow-sm"
                    : isAnswered
                    ? "border-emerald-500/30 bg-card"
                    : "border-border/70"
                }`}
              >
                <CardContent className="p-5 space-y-4">
                  {/* Question Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <span className="flex items-center justify-center size-7 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                        {q.questionNumber}
                      </span>
                      <p className="text-base font-medium leading-snug pt-0.5 text-foreground">
                        {q.text}
                      </p>
                    </div>

                    {isAnswered && (
                      <CheckCircle2 className="size-5 text-emerald-600 shrink-0 mt-0.5" />
                    )}
                  </div>

                  {/* Options (Likert Scale vs Checkbox Toggle Renderer) */}
                  {q.questionType === "checkbox" || definition?.responseType === "checkbox" ? (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          const currentVal = answers[q.id];
                          const isChecked = currentVal === 1 || currentVal === true;
                          handleSelectOption(q.id, isChecked ? 0 : 1);
                        }}
                        className={`w-full sm:w-auto px-5 py-3 rounded-xl border text-sm font-semibold transition-all flex items-center justify-center gap-3 cursor-pointer ${
                          answers[q.id] === 1 || answers[q.id] === true
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-600/30 font-bold"
                            : "bg-background hover:bg-muted/80 text-foreground border-border/80"
                        }`}
                      >
                        <div
                          className={`size-5 rounded border flex items-center justify-center transition-colors ${
                            answers[q.id] === 1 || answers[q.id] === true
                              ? "bg-white text-emerald-600 border-white"
                              : "border-muted-foreground/40 bg-transparent"
                          }`}
                        >
                          {(answers[q.id] === 1 || answers[q.id] === true) && (
                            <CheckCircle2 className="size-4 text-emerald-600 fill-emerald-600" />
                          )}
                        </div>
                        <span>
                          {answers[q.id] === 1 || answers[q.id] === true
                            ? "Selected: I would like to do this"
                            : "Click to select: I would like to do this"}
                        </span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-2">
                      {q.options.map((opt) => {
                        const isSelected = answers[q.id] === opt.value;

                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => handleSelectOption(q.id, opt.value)}
                            className={`p-3 rounded-lg text-xs font-medium border transition-all text-center flex flex-col items-center justify-center gap-1.5 min-h-[52px] ${
                              isSelected
                                ? "bg-primary text-primary-foreground border-primary ring-2 ring-primary/20 font-bold shadow-sm"
                                : "bg-background hover:bg-muted/80 text-foreground border-border/80"
                            }`}
                          >
                            <span className="text-xs">{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Footer Navigation Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-border/60">
          <Button
            variant="outline"
            disabled={activeSectionIndex === 0}
            onClick={() => {
              setActiveSectionIndex((prev) => Math.max(0, prev - 1));
              scrollToFirstQuestion();
            }}
          >
            <ArrowLeft className="mr-2 size-4" /> Previous Section
          </Button>

          {activeSectionIndex < sections.length - 1 ? (
            <Button
              className="font-semibold px-6"
              onClick={() => {
                setActiveSectionIndex((prev) => Math.min(sections.length - 1, prev + 1));
                scrollToFirstQuestion();
              }}
            >
              Next Section <ArrowRight className="ml-2 size-4" />
            </Button>
          ) : (
            <Button
              className="font-bold px-8 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
              onClick={() => setIsSubmittingModalOpen(true)}
            >
              Submit Assessment <CheckCircle2 className="ml-2 size-4" />
            </Button>
          )}
        </div>

        {/* Submit Confirmation Modal */}
        <ConfirmSubmissionModal
          open={isSubmittingModalOpen}
          onClose={() => setIsSubmittingModalOpen(false)}
          onSubmit={handleSubmitAssessment}
          isSubmitting={submitMutation.isPending}
          responseType={definition?.responseType || "likert"}
          stats={{
            answeredCount,
            totalQuestions: totalQuestionsCount,
            selectedCount,
            timeSpentSeconds: timeSpent,
          }}
        />
      </div>
    );
  }

  // ── VIEW 3: COMPLETION (student results) ──────────────────────────────────
  // Derive assessmentKey from definition metadata (set by seeder) with fallbacks
  const assessmentKey =
    definition?.metadata?.assessmentKey ||
    definition?.code?.toLowerCase()?.replace(/_/g, "-") ||
    "ipip-neo-120";

  const nextTitle = nextAssignment?.assessmentDefinitionId?.title || null;

  return (
    <StudentResultsViewer
      assessmentKey={assessmentKey}
      definitionTitle={definition?.title}
      completedAt={session?.submittedAt}
      onBack={onBack}
      nextTitle={nextTitle}
      onContinue={nextTitle ? onContinueToNext : undefined}
    />
  );
}


"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  useSessionState,
  useSessionQuestions,
  useAutosaveProgress,
  useSubmitSession,
} from "../hooks/useAssessmentSession";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import {
  CheckCircle2,
  Clock,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  Save,
  Lock,
  AlertCircle,
  BookOpen,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

export default function StudentAssessmentRunner({ sessionId, onBack }) {
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

  const session = stateData?.data?.session;
  const definition = session?.assessmentDefinitionId;

  const sections = questionsData?.data?.sections || [];
  const questions = questionsData?.data?.questions || [];

  // Populate local answers from backend response data once loaded
  useEffect(() => {
    if (questions.length > 0) {
      const initialAnswers = {};
      questions.forEach((q) => {
        if (q.savedResponse !== null && q.savedResponse !== undefined) {
          initialAnswers[q.id] = q.savedResponse;
        }
      });
      setAnswers(initialAnswers);
    }
  }, [questions]);

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

  // Answered Count calculation
  const totalQuestionsCount = questions.length || 120;
  const answeredCount = Object.keys(answers).filter(
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

  // Format time display (MM:SS)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
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
                <span>Est. {definition?.estimatedDuration || 20} mins</span>
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
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        {/* Sticky Header with Progress Bar & Section Indicators */}
        <div className="sticky top-4 z-20 bg-background/95 backdrop-blur border border-border/80 rounded-xl p-4 shadow-md space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                {definition?.title || "Assessment"}
                <Badge variant="secondary" className="text-[10px] font-mono">
                  {currentSection.title}
                </Badge>
              </h3>
              <p className="text-xs text-muted-foreground">
                {answeredCount} of {totalQuestionsCount} questions answered ({progressPercentage}%)
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs">
              {/* Autosave Indicator */}
              <div className="flex items-center gap-1.5 font-medium">
                {saveStatus === "saving" && (
                  <>
                    <Loader2 className="size-3.5 animate-spin text-amber-500" />
                    <span className="text-amber-600">Autosaving...</span>
                  </>
                )}
                {saveStatus === "saved" && (
                  <>
                    <CheckCircle2 className="size-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Autosaved</span>
                  </>
                )}
                {saveStatus === "unsaved" && (
                  <>
                    <AlertCircle className="size-3.5 text-destructive" />
                    <span className="text-destructive">Unsaved Changes</span>
                  </>
                )}
              </div>

              {/* Timer */}
              <div className="flex items-center gap-1 px-2.5 py-1 rounded bg-muted font-mono font-semibold">
                <Clock className="size-3.5 text-primary" />
                <span>{formatTime(timeSpent)}</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <Progress value={progressPercentage} className="h-2" />

          {/* Section Navigation Tabs */}
          {sections.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pt-1 no-scrollbar">
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
                    onClick={() => setActiveSectionIndex(idx)}
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
          )}
        </div>

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
          {currentSectionQuestions.map((q) => {
            const isAnswered = answers[q.id] !== undefined && answers[q.id] !== null;
            const isFocused = focusedQuestionId === q.id;

            return (
              <Card
                key={q.id}
                tabIndex={0}
                onFocus={() => setFocusedQuestionId(q.id)}
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

                  {/* Options (Likert Scale or Choice Options) */}
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
                          <span className="text-[10px] opacity-75 font-mono">({opt.value})</span>
                        </button>
                      );
                    })}
                  </div>
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
            onClick={() => setActiveSectionIndex((prev) => Math.max(0, prev - 1))}
          >
            <ArrowLeft className="mr-2 size-4" /> Previous Section
          </Button>

          {activeSectionIndex < sections.length - 1 ? (
            <Button
              className="font-semibold px-6"
              onClick={() => setActiveSectionIndex((prev) => Math.min(sections.length - 1, prev + 1))}
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
        {isSubmittingModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="max-w-md w-full border-border shadow-2xl">
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <ShieldCheck className="size-5 text-emerald-600" /> Confirm Submission
                </CardTitle>
                <CardDescription className="text-sm">
                  Are you sure you want to submit your assessment? Once submitted, your answers will be locked and sent for review.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 rounded bg-muted/50 border text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Answered:</span>
                    <span className="font-semibold">{answeredCount} of {totalQuestionsCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Time Spent:</span>
                    <span className="font-semibold">{formatTime(timeSpent)}</span>
                  </div>
                </div>

                {answeredCount < totalQuestionsCount && (
                  <div className="p-3 rounded bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
                    <AlertCircle className="size-4 shrink-0" />
                    <span>You have unanswered questions. Missing answers will be submitted as incomplete.</span>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-end gap-2 border-t pt-4">
                <Button variant="outline" onClick={() => setIsSubmittingModalOpen(false)}>
                  Continue Answering
                </Button>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                  disabled={submitMutation.isPending}
                  onClick={handleSubmitAssessment}
                >
                  {submitMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" /> Submitting...
                    </>
                  ) : (
                    "Confirm & Submit"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}
      </div>
    );
  }

  // ============================================================
  // VIEW 3: COMPLETION SCREEN (STRICTLY NO SCORES/REPORTS SHOWN)
  // ============================================================
  return (
    <div className="max-w-md mx-auto my-12 text-center space-y-6">
      <Card className="border-emerald-500/40 shadow-lg bg-card overflow-hidden">
        <div className="bg-emerald-600 h-2 w-full" />
        <CardHeader className="pt-8 pb-4 space-y-3">
          <div className="mx-auto size-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="size-10" />
          </div>
          <CardTitle className="text-2xl font-bold">Assessment Completed!</CardTitle>
          <CardDescription className="text-sm">
            Thank you for completing the {definition?.title || "assessment"}.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 text-xs text-muted-foreground pb-6">
          <div className="p-4 rounded-lg bg-muted/40 border space-y-2 text-left">
            <div className="flex items-center gap-2 text-foreground font-semibold">
              <Lock className="size-4 text-primary" />
              <span>Session Locked & Submitted</span>
            </div>
            <p className="leading-relaxed">
              Your raw responses have been securely recorded. Your counselor will review your submission during your upcoming guidance session.
            </p>
          </div>

          <div className="text-[11px] opacity-75">
            Submitted at {session?.submittedAt ? new Date(session.submittedAt).toLocaleTimeString() : new Date().toLocaleTimeString()}
          </div>
        </CardContent>

        <CardFooter className="bg-muted/20 border-t p-4">
          <Button
            className="w-full font-semibold"
            onClick={() => onBack ? onBack() : router.push("/assessments")}
          >
            Return to Assessments
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

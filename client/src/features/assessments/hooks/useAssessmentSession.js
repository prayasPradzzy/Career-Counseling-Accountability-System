import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { assessmentSessionService } from "@/services/assessmentSessionService";

export const SESSION_KEYS = {
  all: ["assessment-sessions"],
  active: () => [...SESSION_KEYS.all, "active"],
  detail: (sessionId) => [...SESSION_KEYS.all, "detail", sessionId],
  questions: (sessionId) => [...SESSION_KEYS.all, "questions", sessionId],
  results: (key) => [...SESSION_KEYS.all, "results", key],
};

export function useActiveSession() {
  return useQuery({
    queryKey: SESSION_KEYS.active(),
    queryFn: () => assessmentSessionService.getActiveSession(),
  });
}

export function useSessionState(sessionId) {
  return useQuery({
    queryKey: SESSION_KEYS.detail(sessionId),
    queryFn: () => assessmentSessionService.getSessionState(sessionId),
    enabled: Boolean(sessionId),
  });
}

export function useSessionQuestions(sessionId) {
  return useQuery({
    queryKey: SESSION_KEYS.questions(sessionId),
    queryFn: () => assessmentSessionService.getQuestions(sessionId),
    enabled: Boolean(sessionId),
  });
}

export function useMyAssessmentResults(key = "ipip-neo-120") {
  return useQuery({
    queryKey: SESSION_KEYS.results(key),
    queryFn: () => assessmentSessionService.getMyResults(key),
    enabled: Boolean(key),
  });
}

export function useStartOrResumeSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (assignmentId) => assessmentSessionService.startOrResumeSession(assignmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SESSION_KEYS.all });
    },
  });
}

export function useAutosaveProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, payload }) => assessmentSessionService.autosaveProgress(sessionId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: SESSION_KEYS.detail(variables.sessionId) });
    },
  });
}

export function useSubmitSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId) => assessmentSessionService.submitSession(sessionId),
    onSuccess: (_, sessionId) => {
      queryClient.invalidateQueries({ queryKey: SESSION_KEYS.all });
      queryClient.invalidateQueries({ queryKey: SESSION_KEYS.detail(sessionId) });
    },
  });
}

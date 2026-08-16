import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { interviewService } from "@/services/interview.service";

export const interviewKeys = {
  all: ["interviews"],
  engagement: (studentId) => [...interviewKeys.all, "engagement", studentId],
  questionSet: (sessionId) => [...interviewKeys.all, "questionSet", sessionId],
  audio: (sessionId) => [...interviewKeys.all, "audio", sessionId],
};

/** Fetch the active engagement + completed assessment count for a student */
export function useInterviewEngagement(studentId) {
  return useQuery({
    queryKey: interviewKeys.engagement(studentId),
    queryFn: () => interviewService.getStudentEngagement(studentId),
    enabled: Boolean(studentId),
    staleTime: 1000 * 60 * 2,
  });
}

/** Start (or retrieve) the active engagement */
export function useStartInterviewEngagement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (studentId) => interviewService.startEngagement(studentId),
    onSuccess: (_res, studentId) => {
      queryClient.invalidateQueries({
        queryKey: interviewKeys.engagement(studentId),
      });
    },
  });
}

/** Create an interview session of a given type */
export function useCreateInterviewSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ engagementId, sessionType }) =>
      interviewService.createSession(engagementId, sessionType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: interviewKeys.all });
    },
  });
}

/** Generate the AI question set for a session */
export function useGenerateInterviewQuestions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId) => interviewService.generateQuestions(sessionId),
    onSuccess: (_res, sessionId) => {
      queryClient.invalidateQueries({
        queryKey: interviewKeys.questionSet(sessionId),
      });
    },
  });
}

/** Fetch the latest question set for a session */
export function useInterviewQuestionSet(sessionId) {
  return useQuery({
    queryKey: interviewKeys.questionSet(sessionId),
    queryFn: () => interviewService.getQuestionSet(sessionId),
    enabled: Boolean(sessionId),
    staleTime: 1000 * 60 * 2,
  });
}

/** Edit and/or approve the question set */
export function useApproveInterviewQuestions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, payload }) =>
      interviewService.updateQuestionSet(sessionId, payload),
    onSuccess: (_res, { sessionId }) => {
      queryClient.invalidateQueries({
        queryKey: interviewKeys.questionSet(sessionId),
      });
    },
  });
}

/** Start conducting an approved session */
export function useStartInterviewSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId) => interviewService.startSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: interviewKeys.all });
    },
  });
}

/** Upload a recording for a session (multipart, with progress) */
export function useUploadSessionAudio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, file, onProgress }) =>
      interviewService.uploadAudio(sessionId, file, onProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: interviewKeys.all });
    },
  });
}

/** Fetch the signed, expiring playback URL for a session's recording */
export function useGetSessionAudio(sessionId) {
  return useQuery({
    queryKey: interviewKeys.audio(sessionId),
    queryFn: () => interviewService.getSessionAudio(sessionId),
    enabled: Boolean(sessionId),
    staleTime: 1000 * 60 * 2,
  });
}

/** Complete a recorded session */
export function useCompleteInterviewSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId) => interviewService.completeSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: interviewKeys.all });
    },
  });
}

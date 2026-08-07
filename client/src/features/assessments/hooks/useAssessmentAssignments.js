import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { assessmentAssignmentService } from "@/services/assessmentAssignmentService";

export const ASSIGNMENT_KEYS = {
  all: ["assessment-assignments"],
  my: () => [...ASSIGNMENT_KEYS.all, "my"],
  student: (studentId) => [...ASSIGNMENT_KEYS.all, "student", studentId],
};

export function useMyAssignments() {
  return useQuery({
    queryKey: ASSIGNMENT_KEYS.my(),
    queryFn: () => assessmentAssignmentService.getMyAssignments(),
  });
}

export function useStudentAssignments(studentId) {
  return useQuery({
    queryKey: ASSIGNMENT_KEYS.student(studentId),
    queryFn: () => assessmentAssignmentService.getStudentAssignments(studentId),
    enabled: Boolean(studentId),
  });
}

export function useAssignAssessment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (assignmentData) => assessmentAssignmentService.assignAssessment(assignmentData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ASSIGNMENT_KEYS.all });
      if (variables.studentId) {
        queryClient.invalidateQueries({ queryKey: ASSIGNMENT_KEYS.student(variables.studentId) });
      }
    },
  });
}

export function useStartAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (assignmentId) => assessmentAssignmentService.startAssignment(assignmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ASSIGNMENT_KEYS.all });
    },
  });
}

export function useCompleteAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (assignmentId) => assessmentAssignmentService.completeAssignment(assignmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ASSIGNMENT_KEYS.all });
    },
  });
}

export function useReviewAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ assignmentId, counselorNotes }) =>
      assessmentAssignmentService.reviewAssignment({ assignmentId, counselorNotes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ASSIGNMENT_KEYS.all });
    },
  });
}

export function useApproveAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ assignmentId, counselorNotes }) =>
      assessmentAssignmentService.approveAssignment({ assignmentId, counselorNotes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ASSIGNMENT_KEYS.all });
    },
  });
}

export function useCounselorAssignments(filters = {}) {
  return useQuery({
    queryKey: [...ASSIGNMENT_KEYS.all, "counselor", filters],
    queryFn: () => assessmentAssignmentService.getCounselorAssignments(filters),
  });
}

export function useAssignmentReviewDetail(assignmentId) {
  return useQuery({
    queryKey: [...ASSIGNMENT_KEYS.all, "review-detail", assignmentId],
    queryFn: () => assessmentAssignmentService.getAssignmentReviewDetail(assignmentId),
    enabled: Boolean(assignmentId) && assignmentId !== "undefined",
  });
}

export function useRejectAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ assignmentId, counselorNotes }) =>
      assessmentAssignmentService.rejectAssignment({ assignmentId, counselorNotes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ASSIGNMENT_KEYS.all });
    },
  });
}

export function useRescoreAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (assignmentId) => assessmentAssignmentService.rescoreAssignment(assignmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ASSIGNMENT_KEYS.all });
    },
  });
}

export function useDeleteAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (assignmentId) => assessmentAssignmentService.deleteAssignment(assignmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ASSIGNMENT_KEYS.all });
    },
  });
}

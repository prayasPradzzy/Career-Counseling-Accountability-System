import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { studentService } from "@/services/student.service";

/**
 * Custom React Query Hooks for Student Domain
 */

export const studentKeys = {
  all: ["students"],
  lists: () => [...studentKeys.all, "list"],
  list: (params) => [...studentKeys.lists(), params],
  details: () => [...studentKeys.all, "detail"],
  detail: (id) => [...studentKeys.details(), id],
};

/**
 * Fetch Students Directory List
 */
export function useStudents(params = {}) {
  return useQuery({
    queryKey: studentKeys.list(params),
    queryFn: () => studentService.getStudents(params),
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Fetch Single Student Profile
 */
export function useStudentProfile(id) {
  return useQuery({
    queryKey: studentKeys.detail(id),
    queryFn: () => studentService.getStudentProfile(id),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Register Student Mutation
 */
export function useCreateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => studentService.registerStudent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
    },
  });
}

/**
 * Update Student Mutation
 */
export function useUpdateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => studentService.updateStudentProfile(id, data),
    onSuccess: (_res, variables) => {
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: studentKeys.detail(variables.id) });
    },
  });
}

/**
 * Delete / Archive Student Mutation
 */
export function useDeleteStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => studentService.archiveStudentProfile(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
    },
  });
}

/**
 * Assign Counselor Mutation
 */
export function useAssignCounselor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, counselorId }) => studentService.assignCounselor(id, counselorId),
    onSuccess: (_res, variables) => {
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: studentKeys.detail(variables.id) });
    },
  });
}

/**
 * Update Consent Mutation
 */
export function useUpdateConsent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, consentData }) => studentService.updateConsent(id, consentData),
    onSuccess: (_res, variables) => {
      queryClient.invalidateQueries({ queryKey: studentKeys.detail(variables.id) });
    },
  });
}

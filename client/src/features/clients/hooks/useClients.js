import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clientService } from "@/services/client.service";

/**
 * Custom React Query Hook for Client Management
 */

// Query Key Factory
export const clientKeys = {
  all: ["clients"],
  lists: () => [...clientKeys.all, "list"],
  list: (params) => [...clientKeys.lists(), params],
  details: () => [...clientKeys.all, "detail"],
  detail: (id) => [...clientKeys.details(), id],
};

/**
 * Fetch Clients List with Search & Pagination
 */
export function useClients(params = {}) {
  return useQuery({
    queryKey: clientKeys.list(params),
    queryFn: () => clientService.getClients(params),
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
}

/**
 * Fetch Single Client Profile
 */
export function useClientProfile(id) {
  return useQuery({
    queryKey: clientKeys.detail(id),
    queryFn: () => clientService.getClientProfile(id),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Create Client Profile Mutation
 */
export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => clientService.createClientProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
    },
  });
}

/**
 * Update Client Profile Mutation
 */
export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => clientService.updateClientProfile(id, data),
    onSuccess: (_res, variables) => {
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
      queryClient.invalidateQueries({ queryKey: clientKeys.detail(variables.id) });
    },
  });
}

/**
 * Delete Client Profile Mutation
 */
export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => clientService.deleteClientProfile(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
    },
  });
}

/**
 * Assign Counselor Mutation
 */
export function useAssignCounselor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, counselorId }) => clientService.assignCounselor(id, counselorId),
    onSuccess: (_res, variables) => {
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
      queryClient.invalidateQueries({ queryKey: clientKeys.detail(variables.id) });
    },
  });
}

/**
 * Update Consent Mutation
 */
export function useUpdateConsent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, consentData }) => clientService.updateConsent(id, consentData),
    onSuccess: (_res, variables) => {
      queryClient.invalidateQueries({ queryKey: clientKeys.detail(variables.id) });
    },
  });
}

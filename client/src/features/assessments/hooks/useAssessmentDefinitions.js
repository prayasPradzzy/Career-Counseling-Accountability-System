import { useQuery } from "@tanstack/react-query";
import { assessmentDefinitionService } from "@/services/assessmentDefinitionService";

export const DEFINITION_KEYS = {
  all: ["assessment-definitions"],
  active: () => [...DEFINITION_KEYS.all, "active"],
};

/**
 * Hook to fetch active assessment definitions for the Assign Assessment dialog.
 * Only enabled for counselor/admin roles.
 */
export function useActiveDefinitions(enabled = true) {
  return useQuery({
    queryKey: DEFINITION_KEYS.active(),
    queryFn: () => assessmentDefinitionService.getActiveDefinitions(),
    enabled,
    staleTime: 5 * 60 * 1000, // definitions rarely change, cache 5 min
  });
}

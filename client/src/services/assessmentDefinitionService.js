import api from "@/lib/api";

/**
 * Assessment Definition Service
 * Fetches the assessment catalog for the counselor assignment workflow.
 */
export const assessmentDefinitionService = {
  /**
   * Fetch all active assessment definitions (Counselor/Admin only)
   */
  async getActiveDefinitions() {
    const response = await api.get("/assessment-definitions");
    return response.data;
  },
};

export default assessmentDefinitionService;

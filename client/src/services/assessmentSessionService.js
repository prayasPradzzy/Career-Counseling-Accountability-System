import api from "@/lib/api";

export const assessmentSessionService = {
  /**
   * Start or Resume a session for an assigned assessment
   */
  async startOrResumeSession(assignmentId) {
    const response = await api.post("/assessments/sessions/start", { assignmentId });
    return response.data;
  },

  /**
   * Get student's current active session if any
   */
  async getActiveSession() {
    const response = await api.get("/assessments/sessions/active");
    return response.data;
  },

  /**
   * Get session state, definition info, and progress
   */
  async getSessionState(sessionId) {
    const response = await api.get(`/assessments/sessions/${sessionId}`);
    return response.data;
  },

  /**
   * Fetch structured sections, questions, options, and saved answers for session
   */
  async getQuestions(sessionId) {
    const response = await api.get(`/assessments/sessions/${sessionId}/questions`);
    return response.data;
  },

  /**
   * Autosave progress & responses
   */
  async autosaveProgress(sessionId, payload) {
    const response = await api.patch(`/assessments/sessions/${sessionId}/autosave`, payload);
    return response.data;
  },

  /**
   * Submit and lock session
   */
  async submitSession(sessionId) {
    const response = await api.post(`/assessments/sessions/${sessionId}/submit`);
    return response.data;
  },
};

export default assessmentSessionService;

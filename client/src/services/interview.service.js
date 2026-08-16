import api from "@/lib/api";

/**
 * Interview Domain Service
 * Encapsulates API requests for the AI-assisted interview question
 * workflow (engagement → session → generated question set).
 */
export const interviewService = {
  /** Cross-student aggregate: library stats + roster (counselor only) */
  async getInterviewsOverview() {
    const response = await api.get(`/counselor/interviews/overview`);
    return response.data;
  },

  /** Get the active engagement (or null) + completed assessment count */
  async getStudentEngagement(studentId) {
    const response = await api.get(
      `/counselor/students/${studentId}/interview-engagement`
    );
    return response.data;
  },

  /** Start an engagement (creates one if none is active) */
  async startEngagement(studentId) {
    const response = await api.post(
      `/counselor/students/${studentId}/interview-engagement`
    );
    return response.data;
  },

  /** Create an interview session within an engagement */
  async createSession(engagementId, sessionType) {
    const response = await api.post(
      `/counselor/interview-engagements/${engagementId}/sessions`,
      { sessionType }
    );
    return response.data;
  },

  /** Generate the AI question set for a session */
  async generateQuestions(sessionId) {
    const response = await api.post(
      `/counselor/interview-sessions/${sessionId}/generate-questions`
    );
    return response.data;
  },

  /** Fetch the latest question set for a session */
  async getQuestionSet(sessionId) {
    const response = await api.get(
      `/counselor/interview-sessions/${sessionId}/questions`
    );
    return response.data;
  },

  /** Edit question text and/or approve the set */
  async updateQuestionSet(sessionId, payload) {
    const response = await api.patch(
      `/counselor/interview-sessions/${sessionId}/questions`,
      payload
    );
    return response.data;
  },

  /** Start conducting an approved session (status → in_progress) */
  async startSession(sessionId) {
    const response = await api.post(
      `/counselor/interview-sessions/${sessionId}/start`
    );
    return response.data;
  },

  /**
   * Upload a recorded session audio file (multipart).
   * Large files need a long timeout and upload progress.
   */
  async uploadAudio(sessionId, file, onProgress) {
    const formData = new FormData();
    formData.append("audio", file, file.name);

    const response = await api.post(
      `/counselor/interview-sessions/${sessionId}/audio`,
      formData,
      {
        // Let axios set the multipart boundary (unset the JSON default)
        headers: { "Content-Type": undefined },
        // 10 minutes — a 45-min recording at reasonable quality can be large
        timeout: 10 * 60 * 1000,
        onUploadProgress: (e) => {
          if (typeof onProgress === "function" && e.total) {
            onProgress(Math.round((e.loaded / e.total) * 100));
          }
        },
      }
    );
    return response.data;
  },

  /** Get the signed, expiring playback URL for a session's recording */
  async getSessionAudio(sessionId) {
    const response = await api.get(
      `/counselor/interview-sessions/${sessionId}/audio`
    );
    return response.data;
  },

  /** Complete a recorded session (status → completed) */
  async completeSession(sessionId) {
    const response = await api.post(
      `/counselor/interview-sessions/${sessionId}/complete`
    );
    return response.data;
  },
};

export default interviewService;

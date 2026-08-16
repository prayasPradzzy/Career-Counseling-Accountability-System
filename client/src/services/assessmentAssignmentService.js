import api from "@/lib/api";

export const assessmentAssignmentService = {
  /**
   * Fetch my own assessment assignments (Student)
   */
  async getMyAssignments() {
    const response = await api.get("/assessments/my-assignments");
    return response.data;
  },

  /**
   * Fetch assessment assignments for a specific student (Counselor / Admin / Student)
   */
  async getStudentAssignments(studentId) {
    const response = await api.get(`/assessments/student/${studentId}`);
    return response.data;
  },

  /**
   * Counselor assigns assessment to a student
   */
  async assignAssessment(assignmentData) {
    const response = await api.post("/assessments/assignments", assignmentData);
    return response.data;
  },

  /**
   * Counselor assigns the FULL battery (every active definition) at once
   */
  async assignAllAssessments(studentId) {
    const response = await api.post("/assessments/assign-all", { studentId });
    return response.data;
  },

  /**
   * Student starts an assigned assessment (Enforces Guard Rule & Prerequisite Checks)
   */
  async startAssignment(assignmentId) {
    const response = await api.patch(`/assessments/assignments/${assignmentId}/start`);
    return response.data;
  },

  /**
   * Student completes an assigned assessment
   */
  async completeAssignment(assignmentId) {
    const response = await api.patch(`/assessments/assignments/${assignmentId}/complete`);
    return response.data;
  },

  /**
   * Counselor reviews completed assessment
   */
  async reviewAssignment({ assignmentId, counselorNotes }) {
    const response = await api.patch(`/assessments/assignments/${assignmentId}/review`, { counselorNotes });
    return response.data;
  },

  /**
   * Counselor approves assessment & unlocks next assessment if configured
   */
  async approveAssignment({ assignmentId, counselorNotes }) {
    const response = await api.patch(`/assessments/assignments/${assignmentId}/approve`, { counselorNotes });
    return response.data;
  },

  /**
   * Counselor fetches all assignments with optional filters (statusGroup, category, studentId)
   */
  async getCounselorAssignments(filters = {}) {
    const response = await api.get("/assessments/counselor-assignments", { params: filters });
    return response.data;
  },

  /**
   * Counselor fetches complete review detail (Session progress, Domain Scores, Facet Scores, Raw Responses)
   */
  async getAssignmentReviewDetail(assignmentId) {
    const response = await api.get(`/assessments/assignments/${assignmentId}/review-detail`);
    return response.data;
  },

  /**
   * Counselor requests retake / rejects assignment
   */
  async rejectAssignment({ assignmentId, counselorNotes }) {
    const response = await api.patch(`/assessments/assignments/${assignmentId}/reject`, { counselorNotes });
    return response.data;
  },

  /**
   * Counselor recomputes score (Safety net action)
   */
  async rescoreAssignment(assignmentId) {
    const response = await api.post(`/assessments/assignments/${assignmentId}/rescore`);
    return response.data;
  },

  /**
   * Revoke / Delete Assignment
   */
  async deleteAssignment(assignmentId) {
    const response = await api.delete(`/assessments/assignments/${assignmentId}`);
    return response.data;
  },
};

export default assessmentAssignmentService;

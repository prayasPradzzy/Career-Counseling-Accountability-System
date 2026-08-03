import api from "@/lib/api";
import { API_ENDPOINTS } from "@/constants/api";

/**
 * Student Domain Service
 * Encapsulates API requests for student profiles, registrations, and counselor assignments.
 * React components must never invoke Axios directly.
 */
export const studentService = {
  /**
   * Register a new student profile
   */
  async registerStudent(studentData) {
    const response = await api.post(API_ENDPOINTS.STUDENTS.BASE, studentData);
    return response.data;
  },

  /**
   * List students with search, status filter, and pagination
   */
  async getStudents(params = {}) {
    const response = await api.get(API_ENDPOINTS.STUDENTS.BASE, { params });
    return response.data;
  },

  /**
   * Get single student profile by ID
   */
  async getStudentProfile(id) {
    const response = await api.get(API_ENDPOINTS.STUDENTS.BY_ID(id));
    return response.data;
  },

  /**
   * Update student profile
   */
  async updateStudentProfile(id, updateData) {
    const response = await api.put(API_ENDPOINTS.STUDENTS.BY_ID(id), updateData);
    return response.data;
  },

  /**
   * Archive student profile
   */
  async archiveStudentProfile(id) {
    const response = await api.delete(API_ENDPOINTS.STUDENTS.BY_ID(id));
    return response.data;
  },

  /**
   * Assign counselor to student
   */
  async assignCounselor(studentId, counselorId) {
    const response = await api.patch(API_ENDPOINTS.STUDENTS.ASSIGN_COUNSELOR(studentId), { counselorId });
    return response.data;
  },

  /**
   * Update consent status
   */
  async updateConsent(studentId, consentData) {
    const response = await api.patch(API_ENDPOINTS.STUDENTS.CONSENT(studentId), consentData);
    return response.data;
  },

  /**
   * Get student session history
   */
  async getStudentSessions(studentId) {
    const response = await api.get(API_ENDPOINTS.STUDENTS.SESSIONS(studentId));
    return response.data;
  },
};

export default studentService;

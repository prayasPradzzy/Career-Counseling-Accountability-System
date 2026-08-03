import api from "@/lib/api";
import { API_ENDPOINTS } from "@/constants/api";

/**
 * Authentication Service
 * Centralized API calls for authentication.
 * React components must never call axios/api directly.
 */
export const authService = {
  /**
   * Register a new user
   * @param {Object} userData - { firstName, lastName, email, password, role }
   */
  async signup(userData) {
    const response = await api.post(API_ENDPOINTS.AUTH.SIGNUP, userData);
    return response.data;
  },

  /**
   * Authenticate existing user
   * @param {Object} credentials - { email, password }
   */
  async login(credentials) {
    const response = await api.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
    return response.data;
  },

  /**
   * Log out current user (clears HttpOnly cookie on backend)
   */
  async logout() {
    const response = await api.post(API_ENDPOINTS.AUTH.LOGOUT);
    return response.data;
  },

  /**
   * Get current authenticated user details from session cookie
   */
  async getCurrentUser() {
    const response = await api.get(API_ENDPOINTS.AUTH.ME);
    return response.data;
  },
};

export default authService;

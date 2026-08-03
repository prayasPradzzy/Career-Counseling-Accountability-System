import api from "@/lib/api";
import { API_ENDPOINTS } from "@/constants/api";

/**
 * Client Management Service
 * Centralized API service layer for client profile operations.
 * React components must never invoke Axios directly.
 */
export const clientService = {
  /**
   * Create a new client profile
   */
  async createClientProfile(profileData) {
    const response = await api.post(API_ENDPOINTS.CLIENTS.BASE, profileData);
    return response.data;
  },

  /**
   * List clients with search, status filter, and pagination
   */
  async getClients(params = {}) {
    const response = await api.get(API_ENDPOINTS.CLIENTS.BASE, { params });
    return response.data;
  },

  /**
   * Get single client profile by ID or UserID
   */
  async getClientProfile(id) {
    const response = await api.get(API_ENDPOINTS.CLIENTS.BY_ID(id));
    return response.data;
  },

  /**
   * Update client profile
   */
  async updateClientProfile(id, updateData) {
    const response = await api.put(API_ENDPOINTS.CLIENTS.BY_ID(id), updateData);
    return response.data;
  },

  /**
   * Soft delete client profile
   */
  async deleteClientProfile(id) {
    const response = await api.delete(API_ENDPOINTS.CLIENTS.BY_ID(id));
    return response.data;
  },

  /**
   * Assign counselor to client profile
   */
  async assignCounselor(id, counselorId) {
    const response = await api.patch(API_ENDPOINTS.CLIENTS.ASSIGN_COUNSELOR(id), { counselorId });
    return response.data;
  },

  /**
   * Update consent status
   */
  async updateConsent(id, consentData) {
    const response = await api.patch(API_ENDPOINTS.CLIENTS.CONSENT(id), consentData);
    return response.data;
  },

  /**
   * Get client sessions history
   */
  async getClientSessions(id) {
    const response = await api.get(API_ENDPOINTS.CLIENTS.SESSIONS(id));
    return response.data;
  },
};

export default clientService;

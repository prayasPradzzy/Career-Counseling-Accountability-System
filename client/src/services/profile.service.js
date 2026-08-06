import api from "@/lib/api";

export const profileService = {
  /**
   * Fetch current user's profile (Role-Aware: Student or Counselor)
   */
  async getMyProfile() {
    const response = await api.get("/profile");
    return response.data;
  },

  /**
   * Update current user's profile
   */
  async updateMyProfile(payload) {
    const response = await api.patch("/profile", payload);
    return response.data;
  },

  /**
   * Get dynamic completeness percentage
   */
  async getCompleteness() {
    const response = await api.get("/profile/completeness");
    return response.data;
  },

  /**
   * Get counselor's computed live caseload metrics
   */
  async getCounselorCaseload() {
    const response = await api.get("/counselor/caseload");
    return response.data;
  },

  /**
   * Get counselor's active standing invite code & link
   */
  async getCounselorInviteCode() {
    const response = await api.get("/counselor/invite-code");
    return response.data;
  },

  /**
   * Regenerate counselor's invite code (deactivates old code immediately)
   */
  async regenerateCounselorInviteCode() {
    const response = await api.post("/counselor/invite-code/regenerate");
    return response.data;
  },
};

export default profileService;

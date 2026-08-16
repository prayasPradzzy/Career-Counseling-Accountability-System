import api from "@/lib/api";

/**
 * Notification Domain Service
 * Real notification API — the bell badge and the notifications page both read
 * from here (replaces the old static-dot / local-state placeholder).
 */
export const notificationService = {
  /** Fetch my notifications, newest first */
  async getMyNotifications() {
    const response = await api.get("/notifications");
    return response.data;
  },

  /** Mark a single notification as read */
  async markOneRead(id) {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  },

  /** Mark every notification as read */
  async markAllRead() {
    const response = await api.patch("/notifications/mark-all-read");
    return response.data;
  },

  /** Delete all of my notifications */
  async clearAll() {
    const response = await api.delete("/notifications/clear-all");
    return response.data;
  },
};

export default notificationService;

/**
 * Mock Sessions Data Layer
 * Standardized response shape for appointment stats and session listings.
 */
export const mockSessionsData = {
  stats: {
    upcomingCount: 0,
    completedCount: 0,
    totalHours: 0,
    nextAppointment: "None Scheduled",
  },
  upcomingSessions: [],
  pastSessions: [],
};

export default mockSessionsData;

/**
 * Mock Notifications Data Layer
 * Standardized response shape for user notifications and unread alert feeds.
 */
export const mockNotificationsData = {
  notifications: [
    {
      id: "n-1",
      group: "Today",
      title: "Welcome to CareerPath",
      description: "Your authentication session is active. Explore career counselors and complete your profile.",
      time: "10 minutes ago",
      read: false,
      type: "system",
      iconName: "ShieldAlert",
    },
    {
      id: "n-2",
      group: "Today",
      title: "Assessment Ready",
      description: "The Holland RIASEC Vocational Interest Profile is available to take.",
      time: "2 hours ago",
      read: false,
      type: "assessment",
      iconName: "BookOpen",
    },
    {
      id: "n-3",
      group: "Yesterday",
      title: "Counselor Network Update",
      description: "5 new certified STEM counselors have joined the platform network.",
      time: "Yesterday at 4:30 PM",
      read: true,
      type: "counselor",
      iconName: "Calendar",
    },
    {
      id: "n-4",
      group: "Earlier",
      title: "Account Setup Verified",
      description: "Your client account and role security policies have been verified successfully.",
      time: "Aug 1, 2026",
      read: true,
      type: "system",
      iconName: "FileText",
    },
  ],
};

export default mockNotificationsData;

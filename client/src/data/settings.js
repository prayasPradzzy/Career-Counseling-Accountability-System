/**
 * Mock Settings Data Layer
 * Standardized response shape for user configuration preferences and integrations.
 */
export const mockSettingsData = {
  themeOptions: [
    { value: "light", label: "Light Mode" },
    { value: "dark", label: "Dark Mode" },
    { value: "system", label: "System Default" },
  ],
  privacyOptions: [
    { value: "private", label: "Private (Only Me)" },
    { value: "counselors", label: "Assigned Counselors Only" },
    { value: "public", label: "Platform Counselors & Mentors" },
  ],
  defaultPreferences: {
    theme: "system",
    emailNotifications: true,
    sessionReminders: true,
    profileVisibility: "counselors",
  },
  connectedAccounts: [
    {
      id: "acc-google",
      name: "Google Calendar",
      description: "Sync counseling appointments automatically.",
      connected: false,
    },
    {
      id: "acc-linkedin",
      name: "LinkedIn Profile",
      description: "Import work history and skill endorsements.",
      connected: false,
    },
  ],
};

export default mockSettingsData;

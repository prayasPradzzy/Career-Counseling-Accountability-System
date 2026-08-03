export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  SIGNUP: "/signup",
  DASHBOARD: "/dashboard",
  STUDENTS: "/students",
  STUDENT_NEW: "/students/new",
  STUDENT_DETAIL: (id) => `/students/${id}`,
  SESSIONS: "/sessions",
  COUNSELORS: "/counselors",
  ASSESSMENTS: "/assessments",
  PROFILE: "/profile",
  SETTINGS: "/settings",
  NOTIFICATIONS: "/notifications",
  UNAUTHORIZED: "/unauthorized",
};

export default ROUTES;

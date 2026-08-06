import { ROLES } from "./roles";
import { ROUTES } from "./routes";

/**
 * Data-Driven Role-Based Navigation Configuration
 * Strictly aligned with PRD Section 7 & MVP User Workflows.
 * Icon names are strings mapped via iconRegistry.js.
 */
export const NAV_ITEMS = [
  // 1. Dashboard (All Roles)
  {
    id: "dashboard",
    label: "Dashboard",
    href: ROUTES.DASHBOARD,
    iconName: "LayoutDashboard",
    allowedRoles: [ROLES.STUDENT, ROLES.PARENT, ROLES.COUNSELOR, ROLES.ADMIN],
  },
  // 2. Students Directory (Counselor, Admin)
  {
    id: "students",
    label: "Students",
    href: ROUTES.STUDENTS,
    iconName: "GraduationCap",
    allowedRoles: [ROLES.COUNSELOR, ROLES.ADMIN],
  },
  // 3. Child Progress (Parent Only)
  {
    id: "child-progress",
    label: "Child Progress",
    href: "/progress",
    iconName: "TrendingUp",
    allowedRoles: [ROLES.PARENT],
  },
  // 4. Counselor View (Student: single assigned counselor, Admin: counselor directory)
  {
    id: "counselors",
    label: "My Counselor",
    labelByRole: { [ROLES.ADMIN]: "Counselors" },
    href: ROUTES.COUNSELORS,
    iconName: "UserCheck",
    allowedRoles: [ROLES.STUDENT, ROLES.ADMIN],
  },
  // 5. Career Assessments (Student, Counselor, Admin)
  {
    id: "assessments",
    label: "Assessments",
    href: ROUTES.ASSESSMENTS,
    iconName: "BookOpen",
    allowedRoles: [ROLES.STUDENT, ROLES.COUNSELOR, ROLES.ADMIN],
  },
  // 6. Interview Workspace (Counselor Only)
  {
    id: "workspace",
    label: "Interview Workspace",
    href: "/workspace",
    iconName: "BrainCircuit",
    allowedRoles: [ROLES.COUNSELOR],
  },
  // 7. Career Reports (Student, Counselor, Parent)
  {
    id: "reports",
    label: "Reports",
    href: "/reports",
    iconName: "FileText",
    allowedRoles: [ROLES.STUDENT, ROLES.COUNSELOR, ROLES.PARENT],
  },
  // 8. Career Recommendations (Student, Counselor)
  {
    id: "recommendations",
    label: "Recommendations",
    href: "/recommendations",
    iconName: "Compass",
    allowedRoles: [ROLES.STUDENT, ROLES.COUNSELOR],
  },
  // 9. Career Database (Admin Only)
  {
    id: "career-database",
    label: "Career Database",
    href: "/careers",
    iconName: "Database",
    allowedRoles: [ROLES.ADMIN],
  },
  // 10. Sessions Schedule (Student, Counselor, Parent)
  {
    id: "sessions",
    label: "Sessions",
    href: ROUTES.SESSIONS,
    iconName: "Calendar",
    allowedRoles: [ROLES.STUDENT, ROLES.COUNSELOR, ROLES.PARENT],
  },
  // 11. System Analytics (Admin Only)
  {
    id: "analytics",
    label: "Analytics",
    href: "/analytics",
    iconName: "BarChart3",
    allowedRoles: [ROLES.ADMIN],
  },
  // 12. User Profile (All Roles)
  {
    id: "profile",
    label: "Profile",
    href: ROUTES.PROFILE,
    iconName: "UserCircle",
    allowedRoles: [ROLES.STUDENT, ROLES.PARENT, ROLES.COUNSELOR, ROLES.ADMIN],
  },
  // 13. Settings (Student, Counselor, Admin)
  {
    id: "settings",
    label: "Settings",
    href: ROUTES.SETTINGS,
    iconName: "Settings",
    allowedRoles: [ROLES.STUDENT, ROLES.COUNSELOR, ROLES.ADMIN],
  },
];

export default NAV_ITEMS;

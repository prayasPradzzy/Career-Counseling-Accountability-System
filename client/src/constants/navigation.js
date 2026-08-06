import { ROLES } from "./roles";
import { ROUTES } from "./routes";

/**
 * Data-Driven Role-Based Navigation Configuration
 * Only includes built, fully functional routes for MVP.
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
  // 3. Counselor View (Student: single assigned counselor, Admin: counselor directory)
  {
    id: "counselors",
    label: "My Counselor",
    labelByRole: { [ROLES.ADMIN]: "Counselors" },
    href: ROUTES.COUNSELORS,
    iconName: "UserCheck",
    allowedRoles: [ROLES.STUDENT, ROLES.ADMIN],
  },
  // 4. Career Assessments (Student, Counselor, Admin)
  {
    id: "assessments",
    label: "Assessments",
    href: ROUTES.ASSESSMENTS,
    iconName: "BookOpen",
    allowedRoles: [ROLES.STUDENT, ROLES.COUNSELOR, ROLES.ADMIN],
  },
  // 5. User Profile (All Roles)
  {
    id: "profile",
    label: "Profile",
    href: ROUTES.PROFILE,
    iconName: "UserCircle",
    allowedRoles: [ROLES.STUDENT, ROLES.PARENT, ROLES.COUNSELOR, ROLES.ADMIN],
  },
  // 6. Settings (Student, Counselor, Admin)
  {
    id: "settings",
    label: "Settings",
    href: ROUTES.SETTINGS,
    iconName: "Settings",
    allowedRoles: [ROLES.STUDENT, ROLES.COUNSELOR, ROLES.ADMIN],
  },
];

export default NAV_ITEMS;

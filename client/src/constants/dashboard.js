import { ROLES } from "./roles";
import { ROUTES } from "./routes";

/**
 * Role-Based Dashboard Metadata Configuration
 * Centralized title, subtitle, and metadata per role.
 * Components read from this config to prevent hardcoded titles or routes.
 */
export const ROLE_DASHBOARD_META = {
  [ROLES.STUDENT]: {
    title: "Student Workspace",
    subtitle: "Track your career guidance progress, assessments, and upcoming counseling sessions.",
    defaultRoute: ROUTES.DASHBOARD,
  },
  [ROLES.PARENT]: {
    title: "Parent Portal",
    subtitle: "Monitor your child's career guidance progress, assessment milestones, and counselor sessions.",
    defaultRoute: ROUTES.DASHBOARD,
  },
  [ROLES.COUNSELOR]: {
    title: "Counselor Workspace",
    subtitle: "Manage your assigned students, review assessment results, and conduct counseling interviews.",
    defaultRoute: ROUTES.DASHBOARD,
  },
  [ROLES.ADMIN]: {
    title: "Administrator Command Center",
    subtitle: "Platform analytics, counselor verifications, student directory, and career database controls.",
    defaultRoute: ROUTES.DASHBOARD,
  },
};

export const DEFAULT_DASHBOARD_META = {
  title: "Dashboard",
  subtitle: "Welcome to your Career Counseling workspace.",
  defaultRoute: ROUTES.DASHBOARD,
};

export default ROLE_DASHBOARD_META;

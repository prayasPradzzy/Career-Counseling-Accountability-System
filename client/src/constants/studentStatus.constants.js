/**
 * Centralized Student Lifecycle Status Constants & Enums
 * Standardized status enums, labels, colors, and progression flow for Frontend UI.
 */

export const STUDENT_STATUS = Object.freeze({
  REGISTERED: "REGISTERED",
  PROFILE_INCOMPLETE: "PROFILE_INCOMPLETE",
  PROFILE_COMPLETE: "PROFILE_COMPLETE",
  COUNSELOR_ASSIGNED: "COUNSELOR_ASSIGNED",
  ASSESSMENT_PENDING: "ASSESSMENT_PENDING",
  ASSESSMENT_IN_PROGRESS: "ASSESSMENT_IN_PROGRESS",
  ASSESSMENT_COMPLETED: "ASSESSMENT_COMPLETED",
  INTERVIEW_PENDING: "INTERVIEW_PENDING",
  INTERVIEW_COMPLETED: "INTERVIEW_COMPLETED",
  REPORT_DRAFT: "REPORT_DRAFT",
  REPORT_PUBLISHED: "REPORT_PUBLISHED",
  CAREER_PLAN_COMPLETED: "CAREER_PLAN_COMPLETED",
  // Legacy compatibility states
  ACTIVE: "active",
  INVITED: "invited",
  PENDING_ONBOARDING: "pending-onboarding",
  ARCHIVED: "archived",
});

export const STUDENT_STATUS_LABELS = Object.freeze({
  [STUDENT_STATUS.REGISTERED]: "Registered",
  [STUDENT_STATUS.PROFILE_INCOMPLETE]: "Profile Incomplete",
  [STUDENT_STATUS.PROFILE_COMPLETE]: "Profile Complete",
  [STUDENT_STATUS.COUNSELOR_ASSIGNED]: "Counselor Assigned",
  [STUDENT_STATUS.ASSESSMENT_PENDING]: "Assessment Pending",
  [STUDENT_STATUS.ASSESSMENT_IN_PROGRESS]: "Assessment In Progress",
  [STUDENT_STATUS.ASSESSMENT_COMPLETED]: "Assessment Completed",
  [STUDENT_STATUS.INTERVIEW_PENDING]: "Interview Pending",
  [STUDENT_STATUS.INTERVIEW_COMPLETED]: "Interview Completed",
  [STUDENT_STATUS.REPORT_DRAFT]: "Report Draft",
  [STUDENT_STATUS.REPORT_PUBLISHED]: "Report Published",
  [STUDENT_STATUS.CAREER_PLAN_COMPLETED]: "Career Plan Completed",

  // Legacy mappings
  [STUDENT_STATUS.ACTIVE]: "Active",
  [STUDENT_STATUS.INVITED]: "Invited",
  [STUDENT_STATUS.PENDING_ONBOARDING]: "Pending Onboarding",
  [STUDENT_STATUS.ARCHIVED]: "Archived",
});

export const STUDENT_STATUS_CONFIGS = Object.freeze({
  [STUDENT_STATUS.REGISTERED]: {
    label: "Registered",
    className: "bg-slate-500/10 text-slate-600 border-slate-600/30 dark:text-slate-400",
    badgeVariant: "secondary",
  },
  [STUDENT_STATUS.PROFILE_INCOMPLETE]: {
    label: "Profile Incomplete",
    className: "bg-amber-500/10 text-amber-600 border-amber-600/30 dark:text-amber-400",
    badgeVariant: "outline",
  },
  [STUDENT_STATUS.PROFILE_COMPLETE]: {
    label: "Profile Complete",
    className: "bg-emerald-500/10 text-emerald-600 border-emerald-600/30 dark:text-emerald-400",
    badgeVariant: "outline",
  },
  [STUDENT_STATUS.COUNSELOR_ASSIGNED]: {
    label: "Counselor Assigned",
    className: "bg-blue-500/10 text-blue-600 border-blue-600/30 dark:text-blue-400",
    badgeVariant: "outline",
  },
  [STUDENT_STATUS.ASSESSMENT_PENDING]: {
    label: "Assessment Pending",
    className: "bg-purple-500/10 text-purple-600 border-purple-600/30 dark:text-purple-400",
    badgeVariant: "outline",
  },
  [STUDENT_STATUS.ASSESSMENT_IN_PROGRESS]: {
    label: "Assessment In Progress",
    className: "bg-indigo-500/10 text-indigo-600 border-indigo-600/30 dark:text-indigo-400",
    badgeVariant: "outline",
  },
  [STUDENT_STATUS.ASSESSMENT_COMPLETED]: {
    label: "Assessment Completed",
    className: "bg-cyan-500/10 text-cyan-600 border-cyan-600/30 dark:text-cyan-400",
    badgeVariant: "outline",
  },
  [STUDENT_STATUS.INTERVIEW_PENDING]: {
    label: "Interview Pending",
    className: "bg-amber-500/10 text-amber-600 border-amber-600/30 dark:text-amber-400",
    badgeVariant: "outline",
  },
  [STUDENT_STATUS.INTERVIEW_COMPLETED]: {
    label: "Interview Completed",
    className: "bg-teal-500/10 text-teal-600 border-teal-600/30 dark:text-teal-400",
    badgeVariant: "outline",
  },
  [STUDENT_STATUS.REPORT_DRAFT]: {
    label: "Report Draft",
    className: "bg-sky-500/10 text-sky-600 border-sky-600/30 dark:text-sky-400",
    badgeVariant: "outline",
  },
  [STUDENT_STATUS.REPORT_PUBLISHED]: {
    label: "Report Published",
    className: "bg-emerald-500/10 text-emerald-600 border-emerald-600/30 dark:text-emerald-400",
    badgeVariant: "default",
  },
  [STUDENT_STATUS.CAREER_PLAN_COMPLETED]: {
    label: "Career Plan Completed",
    className: "bg-emerald-600 text-white border-emerald-700 dark:bg-emerald-500",
    badgeVariant: "default",
  },
  // Legacy
  [STUDENT_STATUS.ACTIVE]: {
    label: "Active",
    className: "bg-emerald-500/10 text-emerald-600 border-emerald-600/30 dark:text-emerald-400",
  },
  [STUDENT_STATUS.INVITED]: {
    label: "Invited",
    className: "bg-amber-500/10 text-amber-600 border-amber-600/30 dark:text-amber-400",
  },
  [STUDENT_STATUS.PENDING_ONBOARDING]: {
    label: "Pending Onboarding",
    className: "bg-amber-500/10 text-amber-600 border-amber-600/30 dark:text-amber-400",
  },
  [STUDENT_STATUS.ARCHIVED]: {
    label: "Archived",
    className: "bg-muted text-muted-foreground border-border",
  },
});

export const STUDENT_STATUS_FLOW = Object.freeze([
  STUDENT_STATUS.REGISTERED,
  STUDENT_STATUS.PROFILE_INCOMPLETE,
  STUDENT_STATUS.PROFILE_COMPLETE,
  STUDENT_STATUS.COUNSELOR_ASSIGNED,
  STUDENT_STATUS.ASSESSMENT_PENDING,
  STUDENT_STATUS.ASSESSMENT_IN_PROGRESS,
  STUDENT_STATUS.ASSESSMENT_COMPLETED,
  STUDENT_STATUS.INTERVIEW_PENDING,
  STUDENT_STATUS.INTERVIEW_COMPLETED,
  STUDENT_STATUS.REPORT_DRAFT,
  STUDENT_STATUS.REPORT_PUBLISHED,
  STUDENT_STATUS.CAREER_PLAN_COMPLETED,
]);

/**
 * Filter options dropdown for Tables & Dashboards
 */
export const STUDENT_STATUS_FILTER_OPTIONS = [
  { value: "ALL", label: "All Lifecycle Statuses" },
  ...STUDENT_STATUS_FLOW.map((statusKey) => ({
    value: statusKey,
    label: STUDENT_STATUS_LABELS[statusKey],
  })),
];

/**
 * Derives current student status from profile object on frontend
 */
export function deriveStudentLifecycleStatus(profile, options = {}) {
  if (!profile) return STUDENT_STATUS.REGISTERED;

  if (profile.status === STUDENT_STATUS.ARCHIVED) {
    return STUDENT_STATUS.ARCHIVED;
  }

  if (options.explicitStatus && STUDENT_STATUS_FLOW.includes(options.explicitStatus)) {
    return options.explicitStatus;
  }

  const completionPercentage = options.completionPercentage ?? profile.completionPercentage ?? 0;
  const hasCounselor = Boolean(profile.assignedCounselorId);
  const assessmentState = options.assessmentState || profile.assessmentState || null;
  const interviewState = options.interviewState || profile.interviewState || null;
  const reportState = options.reportState || profile.reportState || null;
  const careerPlanCompleted = Boolean(options.careerPlanCompleted || profile.careerPlanCompleted);

  if (careerPlanCompleted) return STUDENT_STATUS.CAREER_PLAN_COMPLETED;
  if (reportState === "published") return STUDENT_STATUS.REPORT_PUBLISHED;
  if (reportState === "draft") return STUDENT_STATUS.REPORT_DRAFT;
  if (interviewState === "completed") return STUDENT_STATUS.INTERVIEW_COMPLETED;
  if (interviewState === "pending") return STUDENT_STATUS.INTERVIEW_PENDING;
  if (assessmentState === "completed") return STUDENT_STATUS.ASSESSMENT_COMPLETED;
  if (assessmentState === "in-progress") return STUDENT_STATUS.ASSESSMENT_IN_PROGRESS;
  if (assessmentState === "pending") return STUDENT_STATUS.ASSESSMENT_PENDING;
  if (hasCounselor) return STUDENT_STATUS.COUNSELOR_ASSIGNED;
  if (completionPercentage >= 80) return STUDENT_STATUS.PROFILE_COMPLETE;
  if (completionPercentage > 0) return STUDENT_STATUS.PROFILE_INCOMPLETE;

  if (profile.status === "invited") return STUDENT_STATUS.REGISTERED;

  return STUDENT_STATUS.REGISTERED;
}

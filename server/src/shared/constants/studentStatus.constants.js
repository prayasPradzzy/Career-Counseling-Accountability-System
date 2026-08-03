/**
 * Centralized Student Lifecycle Status Constants & Progression Engine
 * Standardized status enums and progression flow for Career Counseling Platform.
 */

const STUDENT_STATUS = Object.freeze({
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

const STUDENT_STATUS_LABELS = Object.freeze({
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

/**
 * Sequential Status Flow Array (Strict progression order)
 */
const STUDENT_STATUS_FLOW = Object.freeze([
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
 * Automatically derives the current Student Lifecycle Status based on profile state and activity flags.
 */
function deriveStudentLifecycleStatus(profile, options = {}) {
  if (!profile) return STUDENT_STATUS.REGISTERED;

  // Respect archived status
  if (profile.status === STUDENT_STATUS.ARCHIVED) {
    return STUDENT_STATUS.ARCHIVED;
  }

  // Allow explicit status override if provided in options or already explicitly set to a advanced lifecycle status
  if (options.explicitStatus && STUDENT_STATUS_FLOW.includes(options.explicitStatus)) {
    return options.explicitStatus;
  }

  const completionPercentage = options.completionPercentage ?? profile.completionPercentage ?? 0;
  const hasCounselor = Boolean(profile.assignedCounselorId);
  const assessmentState = options.assessmentState || profile.assessmentState || null; // 'pending' | 'in-progress' | 'completed'
  const interviewState = options.interviewState || profile.interviewState || null;   // 'pending' | 'completed'
  const reportState = options.reportState || profile.reportState || null;             // 'draft' | 'published'
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

  // Unactivated invitation
  if (profile.status === "invited") return STUDENT_STATUS.REGISTERED;

  return STUDENT_STATUS.REGISTERED;
}

module.exports = {
  STUDENT_STATUS,
  STUDENT_STATUS_LABELS,
  STUDENT_STATUS_FLOW,
  deriveStudentLifecycleStatus,
};

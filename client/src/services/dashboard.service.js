import clientService from "./client.service";
import studentService from "./student.service";
import assessmentAssignmentService from "./assessmentAssignmentService";

/**
 * Operational Dashboard Service
 * Computes operational metrics strictly using real payload data. Zero mock data.
 */
export const dashboardService = {
  /**
   * Compute operational metrics for Student Dashboard
   */
  computeStudentMetrics({ user, profile, assignments = [] }) {
    const assignedCount = assignments.length;
    const completedCount = assignments.filter(
      (a) => a.status === "COMPLETED" || a.status === "APPROVED" || a.status === "UNDER_REVIEW"
    ).length;

    const completionPercentage = profile?.completenessPercentage ?? profile?.completionPercentage ?? 0;

    let lifecycleStatus = "Not Started";
    if (completedCount > 0) {
      lifecycleStatus = "Assessment Completed";
    } else if (assignedCount > 0) {
      lifecycleStatus = "In Progress";
    }

    const stats = [
      {
        id: "assigned-assessments",
        label: "Assigned Assessments",
        value: `${assignedCount}`,
        note: "Total tests unlocked for you",
        iconName: "BookOpen",
        variant: "default",
      },
      {
        id: "completed-assessments",
        label: "Completed Assessments",
        value: `${completedCount}`,
        note: `${completedCount} of ${assignedCount || 1} completed`,
        iconName: "CheckCircle2",
        variant: "success",
      },
      {
        id: "lifecycle-status",
        label: "Current Lifecycle Status",
        value: lifecycleStatus,
        note: "Active guidance stage",
        iconName: "Target",
        variant: "default",
      },
      {
        id: "profile-completion",
        label: "Profile Completion",
        value: `${completionPercentage}%`,
        note: completionPercentage < 100 ? "Details pending completion" : "Profile 100% complete",
        iconName: "Clock",
        variant: completionPercentage === 100 ? "success" : "warning",
      },
    ];

    const assessmentProgress = assignments.map((a) => ({
      id: a._id,
      title: a.assessmentDefinitionId?.title || "Career Assessment",
      category: a.category || a.assessmentDefinitionId?.category || "Psychometric",
      score: a.status === "APPROVED" || a.status === "COMPLETED" || a.status === "UNDER_REVIEW" ? "Completed" : a.status.replace(/_/g, " "),
      status: a.status,
    }));

    return {
      stats,
      assessmentProgress,
      profileCompleteness: completionPercentage,
    };
  },

  /**
   * Compute operational metrics for Counselor Dashboard
   */
  computeCounselorMetrics({ user, clients = [], assignments = [] }) {
    const assignedStudents = clients.filter(
      (c) => c.assignedCounselorId?._id?.toString() === user?._id?.toString() || c.assignedCounselorId === user?._id
    );

    const completedAssessments = assignments.filter(
      (a) => a.status === "COMPLETED" || a.status === "APPROVED" || a.status === "UNDER_REVIEW"
    );
    const inProgressAssessments = assignments.filter((a) => a.status === "IN_PROGRESS");

    const stats = [
      {
        id: "assigned-students",
        label: "Assigned Students",
        value: `${assignedStudents.length}`,
        note: "Active guidance profiles",
        iconName: "Users",
        variant: "default",
      },
      {
        id: "assessments-in-progress",
        label: "Assessments In Progress",
        value: `${inProgressAssessments.length}`,
        note: "Students currently taking tests",
        iconName: "Clock",
        variant: "default",
      },
      {
        id: "completed-assessments",
        label: "Completed Assessments",
        value: `${completedAssessments.length}`,
        note: "Auto-scored student submissions",
        iconName: "CheckCircle2",
        variant: "success",
      },
    ];

    const recentlyCompleted = completedAssessments.map((item) => {
      const studentObj = item.studentId || {};
      const studentName = typeof studentObj === "object"
        ? `${studentObj.firstName || ""} ${studentObj.lastName || ""}`.trim() || studentObj.email || "Student"
        : "Student";
      const definition = item.assessmentDefinitionId || {};
      const title = definition.title || "Career Assessment";

      const completedDate = item.completedAt || item.updatedAt
        ? new Date(item.completedAt || item.updatedAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : "Recently";

      return {
        id: item._id,
        assignmentId: item._id,
        studentProfileId: item.studentId?._id || item.studentId,
        studentName,
        assessmentTitle: title,
        completedAt: completedDate,
        status: item.status,
      };
    });

    return {
      stats,
      recentlyCompletedAssessments: recentlyCompleted,
    };
  },

  /**
   * Compute operational metrics for Admin Dashboard
   */
  computeAdminMetrics({ clients = [], counselors = [], assignments = [] }) {
    const totalStudents = clients.length;
    const activeCounselors = counselors.filter((c) => c.status === "ACTIVE" || c.role === "counselor").length;
    const completedAssessments = assignments.filter((a) => a.status === "COMPLETED" || a.status === "APPROVED" || a.status === "UNDER_REVIEW").length;

    const stats = [
      {
        id: "total-students",
        label: "Total Students",
        value: `${totalStudents}`,
        note: "Registered student accounts",
        iconName: "GraduationCap",
        variant: "default",
      },
      {
        id: "active-counselors",
        label: "Active Counselors",
        value: `${activeCounselors}`,
        note: "Verified guidance advisors",
        iconName: "UserCheck",
        variant: "success",
      },
      {
        id: "total-assessments-completed",
        label: "Total Assessments Completed",
        value: `${completedAssessments}`,
        note: "Successfully submitted & scored",
        iconName: "CheckCircle2",
        variant: "success",
      },
    ];

    return {
      stats,
    };
  },
};

export default dashboardService;

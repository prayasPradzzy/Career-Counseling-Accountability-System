"use client";

import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { useMyAssignments, useCounselorAssignments } from "@/features/assessments/hooks/useAssessmentAssignments";
import { clientService } from "@/services/client.service";
import { profileService } from "@/services/profile.service";
import { dashboardService } from "@/services/dashboard.service";
import { ROLE_DASHBOARD_META, DEFAULT_DASHBOARD_META } from "@/constants/dashboard";
import { ROLES } from "@/constants/roles";
import { PageHeader } from "@/components/layout/PageHeader";
import { LoadingSkeleton } from "@/components/layout/LoadingSkeleton";
import { EmptyIllustration } from "@/components/common/EmptyIllustration";
import {
  StudentDashboardView,
  CounselorDashboardView,
  ParentDashboardView,
  AdminDashboardView,
} from "@/features/dashboard";

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const userRole = user?.role || ROLES.STUDENT;
  const meta = ROLE_DASHBOARD_META[userRole] || DEFAULT_DASHBOARD_META;

  const isStudent = userRole === ROLES.STUDENT;
  const isCounselor = userRole === ROLES.COUNSELOR;
  const isAdmin = userRole === ROLES.ADMIN;
  const isParent = userRole === ROLES.PARENT;

  // Real Queries per Role via Services & React Query
  const { data: studentAssignmentsRes, isLoading: studentAssignmentsLoading } = useMyAssignments({
    enabled: isStudent,
  });

  const { data: counselorAssignmentsRes, isLoading: counselorAssignmentsLoading } = useCounselorAssignments(
    {},
    { enabled: isCounselor || isAdmin }
  );

  const { data: clientsRes, isLoading: clientsLoading } = useQuery({
    queryKey: ["dashboard-clients-list"],
    queryFn: () => clientService.getClients({ limit: 100 }),
    enabled: isCounselor || isAdmin || isParent,
  });

  const { data: profileRes, isLoading: profileLoading } = useQuery({
    queryKey: ["dashboard-my-profile", user?._id],
    queryFn: () => profileService.getMyProfile(),
    enabled: Boolean(user?._id) && (isStudent || isParent),
  });

  const { data: sessionsRes, isLoading: sessionsLoading } = useQuery({
    queryKey: ["dashboard-sessions-list", user?._id],
    queryFn: () => clientService.getClientSessions(user?._id),
    enabled: Boolean(user?._id),
  });

  const isLoading =
    authLoading ||
    (isStudent && (studentAssignmentsLoading || profileLoading)) ||
    ((isCounselor || isAdmin) && (counselorAssignmentsLoading || clientsLoading)) ||
    (isParent && (profileLoading || sessionsLoading));

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title={meta.title} subtitle="Loading operational dashboard..." />
        <LoadingSkeleton cards={3} />
      </div>
    );
  }

  // Extract raw backend payloads
  const studentAssignments = studentAssignmentsRes?.data?.assignments || [];
  const counselorAssignments = counselorAssignmentsRes?.data?.assignments || [];
  const clients = clientsRes?.data?.clients || clientsRes?.clients || [];
  const profileData = profileRes?.data || {};
  const profile = profileData.profile || profileRes?.data?.client || profileRes?.client || {};
  const completenessPercentage = profileData.completenessPercentage;
  const sessions = sessionsRes?.data?.sessions || sessionsRes?.sessions || [];
  const reports = [];

  // Compute presentation data via dashboardService (Business logic remains inside service)
  let dashboardData = {};

  if (isStudent) {
    dashboardData = dashboardService.computeStudentMetrics({
      user,
      profile: { ...profile, completenessPercentage },
      assignments: studentAssignments,
      sessions,
      reports,
    });
  } else if (isCounselor) {
    dashboardData = dashboardService.computeCounselorMetrics({
      user,
      clients,
      assignments: counselorAssignments,
      sessions,
      reports,
    });
  } else if (isAdmin) {
    dashboardData = dashboardService.computeAdminMetrics({
      clients,
      counselors: clients.filter((c) => c.role === "counselor" || c.specialization),
      assignments: counselorAssignments,
      sessions,
    });
  } else if (isParent) {
    dashboardData = dashboardService.computeParentMetrics({
      profile,
      sessions,
      reports,
    });
  }

  // Render role-specific operational dashboard view
  const renderDashboardView = () => {
    switch (userRole) {
      case ROLES.COUNSELOR:
        return <CounselorDashboardView data={dashboardData} />;
      case ROLES.PARENT:
        return <ParentDashboardView data={dashboardData} />;
      case ROLES.ADMIN:
        return <AdminDashboardView data={dashboardData} />;
      case ROLES.STUDENT:
      default:
        return <StudentDashboardView data={dashboardData} />;
    }
  };

  // Dynamic header action button per role
  const getHeaderActions = () => {
    if (userRole === ROLES.ADMIN) {
      return [
        {
          id: "register-student-action",
          label: "Register Student",
          href: "/students/new",
          variant: "default",
          iconName: "Plus",
        },
      ];
    }
    if (userRole === ROLES.COUNSELOR) {
      return [
        {
          id: "schedule-session-action",
          label: "Schedule Session",
          href: "/sessions",
          variant: "default",
          iconName: "Plus",
        },
      ];
    }
    return [
      {
        id: "schedule-session-action",
        label: "Schedule Session",
        href: "/sessions",
        variant: "default",
        iconName: "Plus",
      },
    ];
  };

  return (
    <div className="space-y-6">
      {/* Role-Specific Operational Header */}
      <PageHeader
        title={meta.title}
        subtitle={meta.subtitle}
        actions={getHeaderActions()}
      />

      {/* Role-Driven Operational Dashboard View */}
      {renderDashboardView()}
    </div>
  );
}

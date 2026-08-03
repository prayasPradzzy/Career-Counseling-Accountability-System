"use client";

import { useAuth } from "@/context/AuthContext";
import { ROLE_DASHBOARD_META, DEFAULT_DASHBOARD_META } from "@/constants/dashboard";
import { mockRoleDashboards } from "@/data/dashboard";
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
  const { user, isLoading } = useAuth();

  const userRole = user?.role || ROLES.STUDENT;
  const meta = ROLE_DASHBOARD_META[userRole] || DEFAULT_DASHBOARD_META;
  const dashboardData = mockRoleDashboards[userRole] || mockRoleDashboards[ROLES.STUDENT];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard Workspace" subtitle="Loading operational data..." />
        <LoadingSkeleton cards={3} />
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="space-y-6">
        <PageHeader title={meta.title} subtitle={meta.subtitle} />
        <EmptyIllustration
          iconName="LayoutDashboard"
          title="Operational Data Unavailable"
          description="Could not load metrics for your account role. Please try again later."
          actionLabel="Refresh Page"
          onAction={() => window.location.reload()}
        />
      </div>
    );
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
    if (userRole === ROLES.COUNSELOR) {
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
    if (userRole === ROLES.ADMIN) {
      return [
        {
          id: "counselor-verification-action",
          label: "Verify Counselor",
          href: "/counselors",
          variant: "default",
          iconName: "UserCheck",
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

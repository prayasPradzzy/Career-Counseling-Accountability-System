"use client";

import { use } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  useClientProfile,
  useUpdateConsent,
  useAssignCounselor,
  ProfileCompletion,
  GuardianCard,
  ConsentCard,
  AssignCounselorDialog,
} from "@/features/clients";
import { PageHeader } from "@/components/layout/PageHeader";
import { WidgetGrid } from "@/components/layout/WidgetGrid";
import { LoadingSkeleton } from "@/components/layout/LoadingSkeleton";
import { EmptyIllustration } from "@/components/common/EmptyIllustration";
import { InfoCard } from "@/components/common/InfoCard";
import { SectionCard } from "@/components/common/SectionCard";
import { RoleBadge } from "@/components/common/RoleBadge";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, UserCheck } from "lucide-react";
import { toast } from "sonner";

export default function ClientDetailPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const clientId = params.id;
  const router = useRouter();

  const [assignDialogOpen, setAssignDialogOpen] = useState(false);

  const { data, isLoading, isError, error } = useClientProfile(clientId);
  const updateConsentMutation = useUpdateConsent();
  const assignCounselorMutation = useAssignCounselor();

  const profile = data?.data?.profile;
  const user = profile?.userId || {};
  const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Unnamed Client";
  const initials =
    user.firstName && user.lastName
      ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
      : "U";

  const handleToggleConsent = () => {
    const nextIsGiven = !profile?.consentStatus?.isGiven;

    updateConsentMutation.mutate(
      {
        id: clientId,
        consentData: {
          isGiven: nextIsGiven,
          consentFormUrl: profile?.consentStatus?.consentFormUrl || "",
        },
      },
      {
        onSuccess: () => {
          toast.success(
            nextIsGiven ? "Data consent granted" : "Data consent revoked"
          );
        },
        onError: (err) => {
          toast.error(err.response?.data?.message || "Failed to update consent");
        },
      }
    );
  };

  const handleAssignCounselor = (counselorId) => {
    assignCounselorMutation.mutate(
      { id: clientId, counselorId },
      {
        onSuccess: () => {
          toast.success("Counselor assigned successfully");
          setAssignDialogOpen(false);
        },
        onError: (err) => {
          toast.error(err.response?.data?.message || "Failed to assign counselor");
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Client Profile" subtitle="Loading client details..." />
        <LoadingSkeleton cards={3} />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="space-y-6">
        <PageHeader title="Client Profile" subtitle="Profile view" />
        <EmptyIllustration
          iconName="AlertTriangle"
          title="Client Not Found"
          description={error?.response?.data?.message || "The requested client profile could not be loaded."}
          actionLabel="Back to Directory"
          onAction={() => router.push("/clients")}
        />
      </div>
    );
  }

  const assignedCounselor = profile.assignedCounselorId;

  return (
    <div className="space-y-6">
      <PageHeader
        title={fullName}
        subtitle={`Client Profile ID: ${profile.id || profile._id}`}
        actions={[
          {
            id: "assign-counselor-btn",
            label: "Assign Counselor",
            variant: "outline",
            iconName: "Users",
            onClick: () => setAssignDialogOpen(true),
          },
        ]}
      />

      {/* Header Banner Card */}
      <Card className="border-border shadow-sm bg-gradient-to-r from-primary/5 via-card to-card">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            <Avatar className="size-20 sm:size-24 border-4 border-background shadow-md">
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  {fullName}
                </h2>
                <div className="flex items-center gap-2">
                  <RoleBadge role={user.role} />
                  <StatusBadge status={profile.status || "active"} />
                </div>
              </div>

              <p className="text-sm text-muted-foreground flex items-center justify-center sm:justify-start gap-1.5">
                <Mail className="size-3.5" />
                {user.email}
              </p>

              <div className="pt-1 text-xs text-muted-foreground">
                Assigned Counselor:{" "}
                <span className="font-semibold text-foreground">
                  {assignedCounselor
                    ? `${assignedCounselor.firstName} ${assignedCounselor.lastName} (${assignedCounselor.email})`
                    : "Unassigned"}
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setAssignDialogOpen(true)}
              className="shrink-0 gap-1.5"
            >
              <UserCheck className="size-4" />
              Assign Counselor
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Grid of Profile Section Cards */}
      <WidgetGrid cols={{ default: 1, lg: 2 }} gap="gap-6">
        {/* Intake Progress Card */}
        <ProfileCompletion percentage={profile.completionPercentage || 0} />

        {/* Consent Card */}
        <ConsentCard
          consentStatus={profile.consentStatus}
          onUpdateConsent={handleToggleConsent}
          isUpdating={updateConsentMutation.isPending}
        />

        {/* Basic Identification InfoCard */}
        <InfoCard
          title="Basic Information"
          subtitle="Demographics and identification data"
          iconName="UserCircle"
          items={[
            { label: "Full Name", value: fullName },
            { label: "Email Address", value: user.email },
            { label: "Phone Number", value: profile.phone || "Not provided" },
            {
              label: "Date of Birth",
              value: profile.dateOfBirth
                ? new Date(profile.dateOfBirth).toLocaleDateString()
                : "Not provided",
            },
            { label: "Gender", value: profile.gender || "Not specified" },
            { label: "Account Role", value: user.role || "student" },
          ]}
        />

        {/* Guardian Contact Card */}
        <GuardianCard guardianInfo={profile.guardianInfo} />

        {/* Academic History SectionCard */}
        <SectionCard
          title="Academic History"
          subtitle="Educational degree programs and study discipline"
          iconName="BookOpen"
        >
          {profile.education && profile.education.length > 0 ? (
            <div className="space-y-3 pt-1">
              {profile.education.map((edu, idx) => (
                <div
                  key={edu._id || idx}
                  className="p-3 rounded-lg border border-border bg-muted/20 space-y-1 text-sm"
                >
                  <p className="font-semibold text-foreground">{edu.institution}</p>
                  <p className="text-xs text-primary font-medium">
                    {edu.degree} in {edu.fieldOfStudy}
                  </p>
                  {(edu.startYear || edu.endYear) && (
                    <p className="text-xs text-muted-foreground">
                      {edu.startYear || "?"} – {edu.endYear || "Present"}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground pt-1">No academic history records added.</p>
          )}
        </SectionCard>

        {/* Career Aspirations & Skills SectionCard */}
        <SectionCard
          title="Career Aspirations & Skills"
          subtitle="Target roles and technical competencies"
          iconName="Target"
        >
          <div className="space-y-4 pt-1">
            <div>
              <span className="text-xs text-muted-foreground block mb-1.5">Target Job Roles</span>
              {profile.careerGoals && profile.careerGoals.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {profile.careerGoals.map((goal, i) => (
                    <Badge key={i} variant="outline">
                      {goal}
                    </Badge>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">None specified</span>
              )}
            </div>

            <div>
              <span className="text-xs text-muted-foreground block mb-1.5">Key Skills</span>
              {profile.skills && profile.skills.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {profile.skills.map((skill, i) => (
                    <Badge key={i} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">None specified</span>
              )}
            </div>
          </div>
        </SectionCard>
      </WidgetGrid>

      {/* Assign Counselor Modal Dialog */}
      <AssignCounselorDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        onAssign={handleAssignCounselor}
        isAssigning={assignCounselorMutation.isPending}
      />
    </div>
  );
}

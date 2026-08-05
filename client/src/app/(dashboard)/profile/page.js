"use client";

import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { clientService } from "@/services/client.service";
import { PageHeader } from "@/components/layout/PageHeader";
import { WidgetGrid } from "@/components/layout/WidgetGrid";
import { InfoCard } from "@/components/common/InfoCard";
import { RoleBadge } from "@/components/common/RoleBadge";
import { StatusBadge } from "@/components/common/StatusBadge";
import { SectionCard } from "@/components/common/SectionCard";
import { LoadingSkeleton } from "@/components/layout/LoadingSkeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Edit3, Mail } from "lucide-react";

export default function ProfilePage() {
  const { user, isLoading: authLoading } = useAuth();

  const { data: profileRes, isLoading: profileLoading } = useQuery({
    queryKey: ["client-profile-me", user?._id],
    queryFn: async () => {
      try {
        const res = await clientService.getClientProfile(user?._id);
        return res;
      } catch (err) {
        // Return empty object gracefully if user is counselor/admin or has no student profile yet
        return {};
      }
    },
    enabled: Boolean(user?._id),
  });

  const isLoading = authLoading || (Boolean(user?._id) && profileLoading);

  const profile = profileRes?.data?.profile || profileRes?.data?.client || profileRes?.profile || profileRes?.client || profileRes?.data || {};

  const userInitials =
    user?.firstName && user?.lastName
      ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
      : "U";

  const completionPercentage = profile?.completionPercentage || (user ? 100 : 0);

  const phone = profile?.phone || "Not Provided";
  const gender = profile?.gender || "Not Specified";
  const location = profile?.location || "Not Provided";

  // Academic History
  const educationList = Array.isArray(profile?.education) ? profile.education : [];
  const primaryEdu = educationList[0] || {};
  const institution = primaryEdu.institution || "Not Provided";
  const degree = primaryEdu.degree || "Not Provided";
  const fieldOfStudy = primaryEdu.fieldOfStudy || "Not Provided";
  const graduationYear = primaryEdu.endYear ? String(primaryEdu.endYear) : "Not Specified";

  // Career Aspirations
  const targetRoles = Array.isArray(profile?.careerGoals) ? profile.careerGoals : profile?.careerGoals?.targetRoles || [];
  const keySkills = Array.isArray(profile?.skills) ? profile.skills : [];

  const createdAtDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "Active Member";

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="My Profile" subtitle="Loading your account details..." />
        <LoadingSkeleton cards={3} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Profile"
        subtitle="Manage your personal details, credentials, and guidance roadmap."
      />

      {/* Profile Header Banner Card */}
      <Card className="border-border shadow-sm bg-gradient-to-r from-primary/5 via-card to-card">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            <Avatar className="size-20 sm:size-24 border-4 border-background shadow-md">
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                {userInitials}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-2 flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  {user?.firstName} {user?.lastName}
                </h2>
                <RoleBadge role={user?.role} />
              </div>

              <p className="text-sm text-muted-foreground flex items-center justify-center sm:justify-start gap-1.5">
                <Mail className="size-3.5" />
                {user?.email}
              </p>

              {/* Completion Progress Bar */}
              <div className="pt-2 max-w-md space-y-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Profile Completeness</span>
                  <span className="font-semibold text-foreground">{completionPercentage}%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
              </div>
            </div>

            <Button variant="outline" size="sm" className="shrink-0 gap-2">
              <Edit3 className="size-4" />
              Edit Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info Cards Grid */}
      <WidgetGrid cols={{ default: 1, lg: 2 }} gap="gap-6">
        <InfoCard
          title="Basic Information"
          subtitle="Personal identification and contact details"
          iconName="UserCircle"
          items={[
            { label: "First Name", value: user?.firstName || "N/A" },
            { label: "Last Name", value: user?.lastName || "N/A" },
            { label: "Email Address", value: user?.email || "N/A" },
            { label: "Phone Number", value: phone },
            { label: "Gender Identity", value: gender },
            { label: "Account Scope", value: user?.role || "student" },
          ]}
        />

        <InfoCard
          title="Academic Background"
          subtitle="Current education degree details"
          iconName="BookOpen"
          items={[
            { label: "Institution", value: institution },
            { label: "Degree Program", value: degree },
            { label: "Field of Study", value: fieldOfStudy },
            { label: "Graduation Year", value: graduationYear },
          ]}
        />

        {/* Career Aspirations Section */}
        <SectionCard
          title="Career Aspirations & Skills"
          subtitle="Target job roles and core competencies"
          iconName="Target"
        >
          <div className="space-y-4 pt-1">
            <div>
              <span className="text-xs text-muted-foreground block mb-1.5 font-medium">Target Roles</span>
              {targetRoles.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {targetRoles.map((role, i) => (
                    <Badge key={i} variant="outline">
                      {role}
                    </Badge>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-muted-foreground italic">No target roles specified.</span>
              )}
            </div>

            <div>
              <span className="text-xs text-muted-foreground block mb-1.5 font-medium">Key Skills</span>
              {keySkills.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {keySkills.map((skill, i) => (
                    <Badge key={i} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-muted-foreground italic">No key skills added yet.</span>
              )}
            </div>
          </div>
        </SectionCard>

        {/* Account Credentials Card */}
        <SectionCard
          title="Account Security"
          subtitle="Account status and session credentials"
          iconName="ShieldAlert"
        >
          <div className="grid grid-cols-2 gap-4 text-sm pt-1">
            <div>
              <span className="text-xs text-muted-foreground block">Account Role</span>
              <span className="font-medium text-foreground capitalize">{user?.role || "Student"}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Member Since</span>
              <span className="font-medium text-foreground">{createdAtDate}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Security Status</span>
              <StatusBadge status="active" label="Verified Account" />
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Auth Strategy</span>
              <span className="font-medium text-foreground">JWT HttpOnly Cookie</span>
            </div>
          </div>
        </SectionCard>
      </WidgetGrid>
    </div>
  );
}

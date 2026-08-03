"use client";

import { useAuth } from "@/context/AuthContext";
import { mockProfileData } from "@/data/profile";
import { PageHeader } from "@/components/layout/PageHeader";
import { WidgetGrid } from "@/components/layout/WidgetGrid";
import { InfoCard } from "@/components/common/InfoCard";
import { RoleBadge } from "@/components/common/RoleBadge";
import { StatusBadge } from "@/components/common/StatusBadge";
import { SectionCard } from "@/components/common/SectionCard";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Edit3, Mail } from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();

  const userInitials =
    user?.firstName && user?.lastName
      ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
      : "U";

  const { basicInfo, academicInfo, careerGoals, accountInfo, completionPercentage } = mockProfileData;

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Profile"
        subtitle="Manage your personal details, academic history, and career goals."
        actions={[
          {
            id: "edit-profile",
            label: "Edit Profile",
            variant: "outline",
            iconName: "FileText",
            onClick: () => {},
          },
        ]}
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
                  <span>Profile Completion</span>
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

      {/* Info Cards Grid consuming mockProfileData */}
      <WidgetGrid cols={{ default: 1, lg: 2 }} gap="gap-6">
        <InfoCard
          title="Basic Information"
          subtitle="Personal identification and contact details"
          iconName="UserCircle"
          items={[
            { label: "First Name", value: user?.firstName },
            { label: "Last Name", value: user?.lastName },
            { label: "Email Address", value: user?.email },
            { label: "Phone Number", value: basicInfo.phone },
            { label: "Gender", value: basicInfo.gender },
            { label: "Location", value: basicInfo.location },
          ]}
        />

        <InfoCard
          title="Academic Information"
          subtitle="Current education level and degree details"
          iconName="BookOpen"
          items={[
            { label: "Institution / University", value: academicInfo.institution },
            { label: "Degree Program", value: academicInfo.degree },
            { label: "Field of Study", value: academicInfo.fieldOfStudy },
            { label: "Graduation Year", value: academicInfo.graduationYear },
            { label: "GPA / Grade", value: academicInfo.gpa },
          ]}
        />

        {/* Career Goals Custom SectionCard */}
        <SectionCard
          title="Career Goals"
          subtitle="Target industries and aspirational roles"
          iconName="Target"
        >
          <div className="space-y-4 pt-1">
            <div>
              <span className="text-xs text-muted-foreground block mb-1.5">Target Roles</span>
              <div className="flex flex-wrap gap-1.5">
                {careerGoals.targetRoles.map((role) => (
                  <Badge key={role} variant="outline">
                    {role}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <span className="text-xs text-muted-foreground block mb-1.5">Preferred Industries</span>
              <div className="flex flex-wrap gap-1.5">
                {careerGoals.preferredIndustries.map((ind) => (
                  <Badge key={ind} variant="secondary">
                    {ind}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Account Info Card */}
        <SectionCard
          title="Account Information"
          subtitle="Account status and platform credentials"
          iconName="ShieldAlert"
        >
          <div className="grid grid-cols-2 gap-4 text-sm pt-1">
            <div>
              <span className="text-xs text-muted-foreground block">Account Role</span>
              <span className="font-medium text-foreground capitalize">{user?.role || "Student"}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Member Since</span>
              <span className="font-medium text-foreground">{accountInfo.memberSince}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Security Status</span>
              <StatusBadge status="active" label={accountInfo.securityStatus} />
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Auth Strategy</span>
              <span className="font-medium text-foreground">{accountInfo.authStrategy}</span>
            </div>
          </div>
        </SectionCard>
      </WidgetGrid>
    </div>
  );
}

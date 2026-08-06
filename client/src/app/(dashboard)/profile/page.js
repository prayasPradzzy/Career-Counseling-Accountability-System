"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { profileService } from "@/services/profile.service";
import { PageHeader } from "@/components/layout/PageHeader";
import { RoleBadge } from "@/components/common/RoleBadge";
import { LoadingSkeleton } from "@/components/layout/LoadingSkeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Edit3, Mail } from "lucide-react";
import { CompletenessBar } from "@/features/profile/components/CompletenessBar";
import { StudentProfileTab } from "@/features/profile/components/StudentProfileTab";
import { CounselorProfileTab } from "@/features/profile/components/CounselorProfileTab";
import { ProfileEditModal } from "@/features/profile/components/ProfileEditModal";

export default function ProfilePage() {
  const { user, isLoading: authLoading } = useAuth();
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Fetch Role-Appropriate Profile from /api/v1/profile
  const { data: profileRes, isLoading: profileLoading } = useQuery({
    queryKey: ["my-role-profile", user?._id],
    queryFn: () => profileService.getMyProfile(),
    enabled: Boolean(user?._id),
  });

  const isLoading = authLoading || (Boolean(user?._id) && profileLoading);

  const profileData = profileRes?.data || {};
  const activeUser = profileData.user || user;
  const role = profileData.role || user?.role || "student";
  const profile = profileData.profile || {};
  const completenessPercentage = profileData.completenessPercentage ?? 0;

  const userInitials =
    activeUser?.firstName && activeUser?.lastName
      ? `${activeUser.firstName[0]}${activeUser.lastName[0]}`.toUpperCase()
      : "U";

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="My Profile" subtitle="Loading your profile details..." />
        <LoadingSkeleton cards={3} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Profile"
        subtitle={
          role === "counselor"
            ? "Manage your professional guidance credentials, specializations, and student caseload."
            : "Manage your academic history, career aspirations, and personal details."
        }
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
                  {activeUser?.firstName} {activeUser?.lastName}
                </h2>
                <RoleBadge role={role} />
              </div>

              <p className="text-sm text-muted-foreground flex items-center justify-center sm:justify-start gap-1.5">
                <Mail className="size-3.5" />
                {activeUser?.email}
              </p>

              {/* Dynamic Role-Aware Completeness Bar */}
              <CompletenessBar percentage={completenessPercentage} />
            </div>

            <Button
              variant="outline"
              size="sm"
              className="shrink-0 gap-2 font-medium"
              onClick={() => setIsEditOpen(true)}
            >
              <Edit3 className="size-4" />
              Edit Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Role Router: Switch between CounselorProfileTab and StudentProfileTab */}
      {role === "counselor" || role === "admin" ? (
        <CounselorProfileTab user={activeUser} profile={profile} />
      ) : (
        <StudentProfileTab user={activeUser} profile={profile} />
      )}

      {/* Edit Profile Modal */}
      <ProfileEditModal
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        user={activeUser}
        profile={profile}
      />
    </div>
  );
}

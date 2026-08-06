"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { API_ENDPOINTS } from "@/constants/api";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProfileCard } from "@/components/common/ProfileCard";
import { InfoCard } from "@/components/common/InfoCard";
import { SectionCard } from "@/components/common/SectionCard";
import { EmptyIllustration } from "@/components/common/EmptyIllustration";
import { LoadingSkeleton } from "@/components/layout/LoadingSkeleton";
import { Badge } from "@/components/ui/badge";
import { WidgetGrid } from "@/components/layout/WidgetGrid";
import {
  Mail,
  Phone,
  CheckCircle2,
  CalendarDays,
  Award,
  Globe,
  Briefcase,
} from "lucide-react";

/**
 * CounselorsPage
 *
 * Student view: single assigned counselor profile card (read-only).
 * Admin view: placeholder for future counselor directory (currently shows notice).
 */
export default function CounselorsPage() {
  const { user } = useAuth();
  const isStudent = user?.role === "student";

  if (isStudent) {
    return <StudentCounselorView />;
  }

  // Admin view — can be expanded into a counselor directory later
  return <AdminCounselorListView />;
}

// ─── Student View: Single Assigned Counselor ─────────────────────

function StudentCounselorView() {
  const {
    data: counselorData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["my-counselor"],
    queryFn: async () => {
      const res = await api.get(API_ENDPOINTS.COUNSELOR.MY_COUNSELOR);
      return res.data?.data || null;
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Counselor"
        subtitle="Your assigned career guidance counselor"
      />

      {/* Loading */}
      {isLoading && <LoadingSkeleton cards={1} />}

      {/* Network/Server Error */}
      {!isLoading && isError && (
        <EmptyIllustration
          iconName="AlertCircle"
          title="Unable to Load Counselor"
          description={
            error?.response?.data?.message ||
            "Something went wrong while fetching your counselor's details. Please try again."
          }
          actionLabel="Retry"
          onAction={() => refetch()}
        />
      )}

      {/* No counselor linked (defensive) */}
      {!isLoading && !isError && !counselorData && (
        <EmptyIllustration
          iconName="UserX"
          title="No Counselor Linked"
          description="No counselor is currently assigned to your account. If you believe this is an error, please contact support."
        />
      )}

      {/* Success — Single counselor card */}
      {!isLoading && !isError && counselorData && (
        <CounselorProfileCard counselor={counselorData} />
      )}
    </div>
  );
}

// ─── Counselor Profile Card ──────────────────────────────────────

function CounselorProfileCard({ counselor }) {
  const fullName =
    `${counselor.firstName || ""} ${counselor.lastName || ""}`.trim() ||
    "Your Counselor";

  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const specializations = counselor.practice?.specializations || [];
  const languages = counselor.practice?.languagesSpoken || [];
  const bio = counselor.practice?.bio || "";
  const yearsExp = counselor.practice?.yearsExperience;
  const qualification = counselor.credentials?.highestQualification || "";
  const institution = counselor.credentials?.institution || "";
  const certifications = counselor.credentials?.certifications || [];

  return (
    <div className="space-y-6">
      {/* Primary Card */}
      <SectionCard
        title="Counselor Profile"
        subtitle="Your assigned career guidance counselor"
        iconName="UserCheck"
      >
        <div className="p-5 rounded-xl border border-border/80 bg-card space-y-5">
          {/* Header: Avatar + Name + Badge */}
          <div className="flex items-start gap-4">
            <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary text-xl font-bold shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-lg text-foreground">{fullName}</h3>
                <Badge
                  variant="outline"
                  className="text-[11px] gap-1 bg-emerald-500/10 text-emerald-600 border-emerald-600/30"
                >
                  <CheckCircle2 className="size-3 text-emerald-600" />
                  Verified Counselor
                </Badge>
              </div>

              {qualification && (
                <p className="text-sm text-muted-foreground">
                  {qualification}
                  {institution ? ` — ${institution}` : ""}
                </p>
              )}

              {bio && (
                <p className="text-sm text-muted-foreground leading-relaxed pt-1">{bio}</p>
              )}
            </div>
          </div>

          {/* Contact Info */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground pt-3 border-t border-border/60">
            {counselor.email && (
              <span className="flex items-center gap-1.5">
                <Mail className="size-3.5 text-primary" />
                {counselor.email}
              </span>
            )}
            {counselor.phone && (
              <span className="flex items-center gap-1.5">
                <Phone className="size-3.5 text-primary" />
                {counselor.phone}
              </span>
            )}
          </div>
        </div>
      </SectionCard>

      {/* Details Grid */}
      <WidgetGrid cols={{ default: 1, md: 2 }} gap="gap-6">
        {/* Specializations + Experience */}
        <InfoCard
          title="Expertise"
          subtitle="Areas of specialization and experience"
          iconName="Briefcase"
          items={[
            {
              label: "Years of Experience",
              value: yearsExp ? `${yearsExp} years` : "Not specified",
            },
            {
              label: "Specializations",
              value:
                specializations.length > 0
                  ? specializations.join(", ")
                  : "Not specified",
            },
          ]}
          cols={1}
        />

        {/* Certifications + Languages */}
        <InfoCard
          title="Qualifications"
          subtitle="Certifications and languages spoken"
          iconName="Award"
          items={[
            {
              label: "Certifications",
              value:
                certifications.length > 0
                  ? certifications.join(", ")
                  : "None listed",
            },
            {
              label: "Languages Spoken",
              value:
                languages.length > 0 ? languages.join(", ") : "Not specified",
            },
          ]}
          cols={1}
        />
      </WidgetGrid>
    </div>
  );
}

// ─── Admin View: Counselor Directory (placeholder) ───────────────

function AdminCounselorListView() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Counselors"
        subtitle="Manage and view all registered career counselors"
      />

      <EmptyIllustration
        iconName="Users"
        title="Counselor Directory"
        description="The admin counselor management directory is under development. Counselor data can be viewed via individual student profiles."
      />
    </div>
  );
}

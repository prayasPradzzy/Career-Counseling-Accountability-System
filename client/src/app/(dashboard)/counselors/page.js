"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { clientService } from "@/services/client.service";
import { PageHeader } from "@/components/layout/PageHeader";
import { WidgetGrid } from "@/components/layout/WidgetGrid";
import { FilterBar } from "@/components/common/FilterBar";
import { ProfileCard } from "@/components/common/ProfileCard";
import { EmptyIllustration } from "@/components/common/EmptyIllustration";
import { LoadingSkeleton } from "@/components/layout/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, Calendar } from "lucide-react";

const SPECIALIZATION_OPTIONS = [
  { value: "all", label: "All Specializations" },
  { value: "stem", label: "STEM & Technology" },
  { value: "psychology", label: "Psychology & Behavioral Science" },
  { value: "business", label: "Business & Management" },
  { value: "general", label: "General Career Development" },
];

export default function CounselorsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [specializationFilter, setSpecializationFilter] = useState("all");

  const { data: counselorsData, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["counselors-list"],
    queryFn: async () => {
      const res = await clientService.getClients({ limit: 50 });
      // Filter clients or profiles associated with counselor assignment
      const allItems = res?.data?.clients || res?.data || res?.clients || [];
      return allItems;
    },
  });

  const rawCounselors = counselorsData || [];

  const filteredCounselors = rawCounselors.filter((item) => {
    const userObj = item.userId || item;
    const name = `${userObj.firstName || ""} ${userObj.lastName || ""}`.trim() || item.name || "Counselor";
    const spec = item.specialization || item.degree || "Career Guidance";
    const bio = item.bio || item.notes || "";

    const matchesSearch =
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      spec.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bio.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSpecialization =
      specializationFilter === "all" ||
      spec.toLowerCase().includes(specializationFilter.toLowerCase());

    return matchesSearch && matchesSpecialization;
  });

  const hasActiveFilters = searchQuery !== "" || specializationFilter !== "all";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expert Counselors"
        subtitle="Connect with certified career advisors for personalized 1-on-1 guidance."
      />

      {/* FilterBar Component */}
      <FilterBar
        searchValue={searchQuery}
        onSearchChange={(e) => setSearchQuery(e.target.value)}
        onSearchClear={() => setSearchQuery("")}
        searchPlaceholder="Search counselors by name or domain..."
        hasActiveFilters={hasActiveFilters}
        onResetFilters={() => {
          setSearchQuery("");
          setSpecializationFilter("all");
        }}
        filters={[
          {
            id: "specialization-select",
            component: (
              <Select value={specializationFilter} onValueChange={setSpecializationFilter}>
                <SelectTrigger>
                  <Filter className="mr-2 size-4 text-muted-foreground" />
                  <SelectValue placeholder="All Specializations" />
                </SelectTrigger>
                <SelectContent>
                  {SPECIALIZATION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ),
          },
        ]}
      />

      {/* Loading State */}
      {isLoading && <LoadingSkeleton cards={4} />}

      {/* Error State */}
      {!isLoading && isError && (
        <EmptyIllustration
          iconName="AlertCircle"
          title="Failed to Load Counselors"
          description={error?.message || "An unexpected error occurred while fetching counselor profiles."}
          actionLabel="Try Again"
          onAction={() => refetch()}
        />
      )}

      {/* Success / Empty State */}
      {!isLoading && !isError && (
        filteredCounselors.length > 0 ? (
          <WidgetGrid cols={{ default: 1, md: 2 }} gap="gap-6">
            {filteredCounselors.map((counselor) => {
              const userObj = counselor.userId || counselor;
              const name = `${userObj.firstName || ""} ${userObj.lastName || ""}`.trim() || counselor.name || "Counselor";
              const initials = name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .substring(0, 2)
                .toUpperCase();
              const id = counselor._id || counselor.id || userObj._id;

              return (
                <ProfileCard
                  key={id}
                  name={name}
                  initials={initials}
                  subtitle={counselor.specialization || "Career Counselor"}
                  status={counselor.status === "ACTIVE" ? "success" : "neutral"}
                  statusLabel={counselor.status || "Verified"}
                  metaItems={[
                    { label: "Role", value: "Counselor Advisor" },
                    { label: "Status", value: counselor.status || "Active" },
                  ]}
                  action={
                    <Button className="w-full font-semibold shadow" size="sm">
                      <Calendar className="mr-2 size-4" />
                      Book Session
                    </Button>
                  }
                />
              );
            })}
          </WidgetGrid>
        ) : (
          <EmptyIllustration
            iconName="Users"
            title="No Counselors Found"
            description="No career advisors matched your criteria."
            actionLabel="Clear Filters"
            onAction={() => {
              setSearchQuery("");
              setSpecializationFilter("all");
            }}
          />
        )
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { mockCounselorsData } from "@/data/counselors";
import { PageHeader } from "@/components/layout/PageHeader";
import { WidgetGrid } from "@/components/layout/WidgetGrid";
import { FilterBar } from "@/components/common/FilterBar";
import { ProfileCard } from "@/components/common/ProfileCard";
import { EmptyIllustration } from "@/components/common/EmptyIllustration";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, Calendar, Star } from "lucide-react";

export default function CounselorsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [specializationFilter, setSpecializationFilter] = useState("all");

  const { counselors, specializationOptions } = mockCounselorsData;

  const filteredCounselors = counselors.filter((counselor) => {
    const matchesSearch =
      counselor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      counselor.specialization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      counselor.bio.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSpecialization =
      specializationFilter === "all" ||
      counselor.specialization.toLowerCase().includes(specializationFilter.toLowerCase());

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
                  {specializationOptions.map((opt) => (
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

      {/* Counselor Grid */}
      {filteredCounselors.length > 0 ? (
        <WidgetGrid cols={{ default: 1, md: 2 }} gap="gap-6">
          {filteredCounselors.map((counselor) => (
            <ProfileCard
              key={counselor.id}
              name={counselor.name}
              initials={counselor.initials}
              subtitle={counselor.specialization}
              status={counselor.availabilityStatus}
              statusLabel={counselor.availability}
              metaItems={[
                { label: "Experience", value: `${counselor.experienceYears} Years` },
                {
                  label: "Rating",
                  value: `${counselor.rating} ⭐ (${counselor.reviewCount})`,
                },
              ]}
              action={
                <Button className="w-full font-semibold shadow" size="sm">
                  <Calendar className="mr-2 size-4" />
                  Book Session
                </Button>
              }
            />
          ))}
        </WidgetGrid>
      ) : (
        <EmptyIllustration
          iconName="Users"
          title="No Counselors Found"
          description="No career advisors matched your filter criteria. Try adjusting your search query."
          actionLabel="Clear Filters"
          onAction={() => {
            setSearchQuery("");
            setSpecializationFilter("all");
          }}
        />
      )}
    </div>
  );
}

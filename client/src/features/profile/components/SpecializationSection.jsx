"use client";

import { SectionCard } from "@/components/common/SectionCard";
import { Badge } from "@/components/ui/badge";

export function SpecializationSection({ practice }) {
  const specializations = Array.isArray(practice?.specializations) ? practice.specializations : [];
  const yearsExperience = typeof practice?.yearsExperience === "number" ? practice.yearsExperience : 0;
  const languagesSpoken = Array.isArray(practice?.languagesSpoken) ? practice.languagesSpoken : [];
  const bio = practice?.bio || "No professional biography provided yet.";

  return (
    <SectionCard
      title="Specialization & Approach"
      subtitle="Counseling domains, languages spoken, and professional biography"
      iconName="Compass"
    >
      <div className="space-y-4 pt-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-xs text-muted-foreground block font-medium">Years of Experience</span>
            <span className="font-semibold text-foreground">{yearsExperience} {yearsExperience === 1 ? "Year" : "Years"}</span>
          </div>
          <div>
            <span className="text-xs text-muted-foreground block font-medium">Languages Spoken</span>
            {languagesSpoken.length > 0 ? (
              <div className="flex flex-wrap gap-1 mt-1">
                {languagesSpoken.map((lang, i) => (
                  <Badge key={i} variant="secondary" className="text-[11px]">
                    {lang}
                  </Badge>
                ))}
              </div>
            ) : (
              <span className="text-xs text-muted-foreground italic">Not Specified</span>
            )}
          </div>
        </div>

        <div>
          <span className="text-xs text-muted-foreground block mb-1.5 font-medium">Specialization Domains</span>
          {specializations.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {specializations.map((spec, i) => (
                <Badge key={i} variant="default" className="text-xs">
                  {spec}
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-xs text-muted-foreground italic">No specializations added yet.</span>
          )}
        </div>

        <div>
          <span className="text-xs text-muted-foreground block mb-1 font-medium">Professional Biography</span>
          <p className="text-xs text-muted-foreground leading-relaxed p-3 rounded-lg bg-muted/30 border border-border/50">
            {bio}
          </p>
        </div>
      </div>
    </SectionCard>
  );
}

export default SpecializationSection;

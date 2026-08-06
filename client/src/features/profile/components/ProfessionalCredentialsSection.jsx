"use client";

import { InfoCard } from "@/components/common/InfoCard";
import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/common/SectionCard";

export function ProfessionalCredentialsSection({ credentials }) {
  const highestQualification = credentials?.highestQualification || "Not Provided";
  const institution = credentials?.institution || "Not Provided";
  const licenseNumber = credentials?.licenseNumber || "N/A (Optional)";
  const certifications = Array.isArray(credentials?.certifications) ? credentials.certifications : [];

  return (
    <SectionCard
      title="Professional Credentials"
      subtitle="Academic qualifications and clinical/counseling certifications"
      iconName="Award"
    >
      <div className="space-y-4 pt-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-xs text-muted-foreground block font-medium">Highest Qualification</span>
            <span className="font-semibold text-foreground">{highestQualification}</span>
          </div>
          <div>
            <span className="text-xs text-muted-foreground block font-medium">Graduating Institution</span>
            <span className="font-medium text-foreground">{institution}</span>
          </div>
          <div>
            <span className="text-xs text-muted-foreground block font-medium">License / Registration No.</span>
            <span className="font-mono text-xs font-medium text-foreground">{licenseNumber}</span>
          </div>
        </div>

        <div>
          <span className="text-xs text-muted-foreground block mb-1.5 font-medium">Certifications & Licenses</span>
          {certifications.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {certifications.map((cert, i) => (
                <Badge key={i} variant="outline" className="bg-primary/5 text-primary border-primary/20">
                  {cert}
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-xs text-muted-foreground italic">No certifications added yet.</span>
          )}
        </div>
      </div>
    </SectionCard>
  );
}

export default ProfessionalCredentialsSection;

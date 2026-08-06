"use client";

import { BasicInfoSection } from "./BasicInfoSection";
import { AccountSecuritySection } from "./AccountSecuritySection";
import { InfoCard } from "@/components/common/InfoCard";
import { SectionCard } from "@/components/common/SectionCard";
import { WidgetGrid } from "@/components/layout/WidgetGrid";
import { Badge } from "@/components/ui/badge";

export function StudentProfileTab({ user, profile }) {
  const educationList = Array.isArray(profile?.education) ? profile.education : [];
  const primaryEdu = educationList[0] || profile?.academic || {};
  const institution = primaryEdu.institution || "Not Provided";
  const degree = primaryEdu.degreeProgram || primaryEdu.degree || "Not Provided";
  const fieldOfStudy = primaryEdu.fieldOfStudy || "Not Provided";
  const graduationYear = primaryEdu.graduationYear || primaryEdu.endYear ? String(primaryEdu.graduationYear || primaryEdu.endYear) : "Not Specified";

  const targetRoles = profile?.careerGoals?.targetRoles || (Array.isArray(profile?.careerGoals) ? profile.careerGoals : []);
  const keySkills = profile?.careerGoals?.keySkills || (Array.isArray(profile?.skills) ? profile.skills : []);

  return (
    <WidgetGrid cols={{ default: 1, lg: 2 }} gap="gap-6">
      <BasicInfoSection user={user} profile={profile} />

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

      <AccountSecuritySection user={user} />
    </WidgetGrid>
  );
}

export default StudentProfileTab;

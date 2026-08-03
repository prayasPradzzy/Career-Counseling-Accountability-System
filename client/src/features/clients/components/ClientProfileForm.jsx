"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormLayout, FormSection, FormRow, FormActions } from "@/components/common/FormLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Loader2 } from "lucide-react";

const clientFormSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["male", "female", "non-binary", "prefer-not-to-say"]).optional(),
  institution: z.string().optional(),
  degree: z.string().optional(),
  fieldOfStudy: z.string().optional(),
  targetRoles: z.string().optional(), // Comma-separated
  skills: z.string().optional(), // Comma-separated
  guardianName: z.string().optional(),
  guardianRelationship: z.string().optional(),
  guardianEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  guardianPhone: z.string().optional(),
});

export function ClientProfileForm({
  initialValues = {},
  onSubmit,
  isSubmitting = false,
  isEditMode = false,
}) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      userId: initialValues.userId || "",
      phone: initialValues.phone || "",
      dateOfBirth: initialValues.dateOfBirth ? initialValues.dateOfBirth.split("T")[0] : "",
      gender: initialValues.gender || "prefer-not-to-say",
      institution: initialValues.education?.[0]?.institution || "",
      degree: initialValues.education?.[0]?.degree || "",
      fieldOfStudy: initialValues.education?.[0]?.fieldOfStudy || "",
      targetRoles: Array.isArray(initialValues.careerGoals) ? initialValues.careerGoals.join(", ") : "",
      skills: Array.isArray(initialValues.skills) ? initialValues.skills.join(", ") : "",
      guardianName: initialValues.guardianInfo?.name || "",
      guardianRelationship: initialValues.guardianInfo?.relationship || "",
      guardianEmail: initialValues.guardianInfo?.email || "",
      guardianPhone: initialValues.guardianInfo?.phone || "",
    },
  });

  const genderValue = watch("gender");

  const onFormSubmit = (data) => {
    const formattedPayload = {
      userId: data.userId,
      phone: data.phone,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      education:
        data.institution && data.degree
          ? [
              {
                institution: data.institution,
                degree: data.degree,
                fieldOfStudy: data.fieldOfStudy || "General",
              },
            ]
          : [],
      careerGoals: data.targetRoles ? data.targetRoles.split(",").map((s) => s.trim()).filter(Boolean) : [],
      skills: data.skills ? data.skills.split(",").map((s) => s.trim()).filter(Boolean) : [],
      guardianInfo: {
        name: data.guardianName,
        relationship: data.guardianRelationship,
        email: data.guardianEmail,
        phone: data.guardianPhone,
      },
    };

    onSubmit(formattedPayload);
  };

  return (
    <FormLayout onSubmit={handleSubmit(onFormSubmit)}>
      {/* 1. Account & Personal Information */}
      <FormSection
        title="Personal Identification"
        description="Target user account binding and contact demographics."
      >
        <FormRow cols={2}>
          <div className="space-y-2">
            <Label htmlFor="userId">
              Target User ID <span className="text-destructive">*</span>
            </Label>
            <Input
              id="userId"
              placeholder="e.g. 65a1234567890abcdef12345"
              disabled={isEditMode}
              {...register("userId")}
            />
            {errors.userId && (
              <p className="text-xs text-destructive">{errors.userId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" placeholder="+1 (555) 234-5678" {...register("phone")} />
          </div>
        </FormRow>

        <FormRow cols={2}>
          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <Input id="dateOfBirth" type="date" {...register("dateOfBirth")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">Gender Identity</Label>
            <Select value={genderValue} onValueChange={(val) => setValue("gender", val)}>
              <SelectTrigger id="gender">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="non-binary">Non-Binary</SelectItem>
                <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </FormRow>
      </FormSection>

      {/* 2. Academic Background */}
      <FormSection
        title="Academic History"
        description="Primary educational institution, degree, and study discipline."
      >
        <FormRow cols={3}>
          <div className="space-y-2">
            <Label htmlFor="institution">Institution / School</Label>
            <Input id="institution" placeholder="e.g. Columbia University" {...register("institution")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="degree">Degree Program</Label>
            <Input id="degree" placeholder="e.g. Bachelor of Science" {...register("degree")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fieldOfStudy">Field of Study</Label>
            <Input id="fieldOfStudy" placeholder="e.g. Computer Science" {...register("fieldOfStudy")} />
          </div>
        </FormRow>
      </FormSection>

      {/* 3. Career Aspirations & Skills */}
      <FormSection
        title="Career Goals & Skills"
        description="Target job roles and current technical/soft skill competencies."
      >
        <FormRow cols={2}>
          <div className="space-y-2">
            <Label htmlFor="targetRoles">Target Roles (Comma-separated)</Label>
            <Input
              id="targetRoles"
              placeholder="Software Architect, AI Engineer, Product Lead"
              {...register("targetRoles")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="skills">Key Skills (Comma-separated)</Label>
            <Input id="skills" placeholder="JavaScript, Python, System Design" {...register("skills")} />
          </div>
        </FormRow>
      </FormSection>

      {/* 4. Guardian & Emergency Information */}
      <FormSection
        title="Guardian Information"
        description="Contact details for parents or legal guardians."
      >
        <FormRow cols={2}>
          <div className="space-y-2">
            <Label htmlFor="guardianName">Guardian Name</Label>
            <Input id="guardianName" placeholder="Jane Doe" {...register("guardianName")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="guardianRelationship">Relationship</Label>
            <Input id="guardianRelationship" placeholder="Mother / Father" {...register("guardianRelationship")} />
          </div>
        </FormRow>

        <FormRow cols={2}>
          <div className="space-y-2">
            <Label htmlFor="guardianEmail">Guardian Email</Label>
            <Input id="guardianEmail" type="email" placeholder="guardian@example.com" {...register("guardianEmail")} />
            {errors.guardianEmail && (
              <p className="text-xs text-destructive">{errors.guardianEmail.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="guardianPhone">Guardian Phone</Label>
            <Input id="guardianPhone" placeholder="+1 (555) 987-6543" {...register("guardianPhone")} />
          </div>
        </FormRow>

        <FormActions>
          <Button type="submit" disabled={isSubmitting} className="font-semibold shadow">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Saving Profile...
              </>
            ) : (
              <>
                <Save className="mr-2 size-4" />
                {isEditMode ? "Update Profile" : "Create Client Profile"}
              </>
            )}
          </Button>
        </FormActions>
      </FormSection>
    </FormLayout>
  );
}

export default ClientProfileForm;

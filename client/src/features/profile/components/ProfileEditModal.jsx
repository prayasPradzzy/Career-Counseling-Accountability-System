"use client";

import { useState, useEffect, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { profileService } from "@/services/profile.service";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function ProfileEditModal({ open, onOpenChange, user, profile }) {
  const queryClient = useQueryClient();
  const role = user?.role || "student";

  // Form State
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("prefer-not-to-say");

  // Student fields
  const [institution, setInstitution] = useState("");
  const [degreeProgram, setDegreeProgram] = useState("");
  const [fieldOfStudy, setFieldOfStudy] = useState("");
  const [graduationYear, setGraduationYear] = useState("");
  const [targetRolesStr, setTargetRolesStr] = useState("");
  const [keySkillsStr, setKeySkillsStr] = useState("");

  // Counselor fields
  const [highestQualification, setHighestQualification] = useState("");
  const [counselorInst, setCounselorInst] = useState("");
  const [certificationsStr, setCertificationsStr] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [specializationsStr, setSpecializationsStr] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [languagesStr, setLanguagesStr] = useState("");
  const [bio, setBio] = useState("");

  // Field-level Inline Error State
  const [fieldErrors, setFieldErrors] = useState({});

  // Reset form to latest profile data
  const resetForm = useCallback(() => {
    setFieldErrors({});
    if (!profile) return;

    setPhone(profile.phone || "");
    setGender(profile.gender || "prefer-not-to-say");

    if (role === "student") {
      const edu = (Array.isArray(profile.education) && profile.education[0]) || profile.academic || {};
      setInstitution(edu.institution || "");
      setDegreeProgram(edu.degreeProgram || edu.degree || "");
      setFieldOfStudy(edu.fieldOfStudy || "");
      
      const gradYr = edu.graduationYear || edu.endYear;
      setGraduationYear(gradYr ? String(gradYr) : "");

      const roles = profile.careerGoals?.targetRoles || (Array.isArray(profile.careerGoals) ? profile.careerGoals : []);
      setTargetRolesStr(Array.isArray(roles) ? roles.join(", ") : "");

      const skills = profile.careerGoals?.keySkills || (Array.isArray(profile.skills) ? profile.skills : []);
      setKeySkillsStr(Array.isArray(skills) ? skills.join(", ") : "");
    } else {
      // Counselor
      const creds = profile.credentials || {};
      setHighestQualification(creds.highestQualification || "");
      setCounselorInst(creds.institution || "");
      setCertificationsStr(Array.isArray(creds.certifications) ? creds.certifications.join(", ") : "");
      setLicenseNumber(creds.licenseNumber || "");

      const pr = profile.practice || {};
      setSpecializationsStr(Array.isArray(pr.specializations) ? pr.specializations.join(", ") : "");
      setYearsExperience(pr.yearsExperience ? String(pr.yearsExperience) : "0");
      setLanguagesStr(Array.isArray(pr.languagesSpoken) ? pr.languagesSpoken.join(", ") : "");
      setBio(pr.bio || "");
    }
  }, [profile, role]);

  // Sync state on modal open or profile change
  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open, profile, resetForm]);

  const updateMutation = useMutation({
    mutationFn: (payload) => profileService.updateMyProfile(payload),
    onSuccess: () => {
      toast.success("Profile updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["my-role-profile"] });
      queryClient.invalidateQueries({ queryKey: ["profile-completeness"] });
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      setFieldErrors({});
      onOpenChange(false);
    },
    onError: (err) => {
      const errRes = err?.response?.data;
      if (errRes?.errors && typeof errRes.errors === "object" && !Array.isArray(errRes.errors)) {
        setFieldErrors(errRes.errors);
      }
      toast.error(errRes?.message || "Failed to update profile.");
    },
  });

  const parseCommaList = (str) => {
    if (!str || typeof str !== "string") return [];
    return str
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  };

  const handleCancel = () => {
    resetForm();
    onOpenChange(false);
  };

  const validate = () => {
    const errors = {};

    // 1. Phone validation (optional, but if present must be valid international phone format)
    if (phone && phone.trim()) {
      const cleanPhone = phone.trim();
      const phoneRegex = /^\+?[0-9\s\-().]{7,20}$/;
      if (!phoneRegex.test(cleanPhone)) {
        errors.phone = "Please enter a valid phone number (7-20 digits, e.g. +1 (555) 000-0000 or +91 9876543210).";
      }
    }

    // 2. Graduation Year validation (Student role)
    if (role === "student" && graduationYear && graduationYear.trim()) {
      const gradYearTrimmed = graduationYear.trim();
      const yearNum = Number(gradYearTrimmed);
      const currentYear = new Date().getFullYear();

      if (
        isNaN(yearNum) ||
        !/^\d{4}$/.test(gradYearTrimmed) ||
        yearNum < 1950 ||
        yearNum > 2100 ||
        yearNum < currentYear - 2 ||
        yearNum > currentYear + 15
      ) {
        errors.graduationYear = `Graduation year must be a 4-digit number between ${currentYear - 2} and ${currentYear + 15}.`;
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) {
      toast.error("Please fix the validation errors before saving.");
      return;
    }

    let payload = {
      phone: phone.trim(),
      gender,
    };

    if (role === "student") {
      payload.academic = {
        institution: institution.trim(),
        degreeProgram: degreeProgram.trim(),
        fieldOfStudy: fieldOfStudy.trim(),
        graduationYear: graduationYear.trim() ? Number(graduationYear.trim()) : undefined,
      };
      payload.careerGoals = {
        targetRoles: parseCommaList(targetRolesStr),
        keySkills: parseCommaList(keySkillsStr),
      };
    } else {
      payload.credentials = {
        highestQualification: highestQualification.trim(),
        institution: counselorInst.trim(),
        certifications: parseCommaList(certificationsStr),
        licenseNumber: licenseNumber.trim(),
      };
      payload.practice = {
        specializations: parseCommaList(specializationsStr),
        yearsExperience: yearsExperience.trim() ? Number(yearsExperience.trim()) : 0,
        languagesSpoken: parseCommaList(languagesStr),
        bio: bio.trim(),
      };
    }

    updateMutation.mutate(payload);
  };

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit {role === "counselor" ? "Counselor" : "Student"} Profile</DialogTitle>
          <DialogDescription>
            Update your role-specific information below. All inputs are strictly validated.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Shared Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Phone Number</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className={fieldErrors.phone ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {fieldErrors.phone && (
                <p className="text-[11px] font-medium text-destructive mt-1">{fieldErrors.phone}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Gender Identity</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="non-binary">Non-Binary</SelectItem>
                  <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Role Specific Fields */}
          {role === "student" ? (
            <>
              <div className="border-t pt-3 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Academic Background</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Institution</Label>
                    <Input
                      value={institution}
                      onChange={(e) => setInstitution(e.target.value)}
                      placeholder="High School / College / University Name"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Degree Program</Label>
                    <Input
                      value={degreeProgram}
                      onChange={(e) => setDegreeProgram(e.target.value)}
                      placeholder="High School, B.Sc, M.Sc"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Field of Study</Label>
                    <Input
                      value={fieldOfStudy}
                      onChange={(e) => setFieldOfStudy(e.target.value)}
                      placeholder="Computer Science, Commerce, Science"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Graduation Year</Label>
                    <Input
                      type="number"
                      value={graduationYear}
                      onChange={(e) => setGraduationYear(e.target.value)}
                      placeholder="2026"
                      className={fieldErrors.graduationYear ? "border-destructive focus-visible:ring-destructive" : ""}
                    />
                    {fieldErrors.graduationYear && (
                      <p className="text-[11px] font-medium text-destructive mt-1">{fieldErrors.graduationYear}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t pt-3 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Career Goals & Skills</h4>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Target Roles (comma-separated)</Label>
                    <Input
                      value={targetRolesStr}
                      onChange={(e) => setTargetRolesStr(e.target.value)}
                      placeholder="Software Engineer, Data Analyst, UX Designer"
                    />
                    <p className="text-[10px] text-muted-foreground">Separate multiple roles with commas.</p>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Key Skills (comma-separated)</Label>
                    <Input
                      value={keySkillsStr}
                      onChange={(e) => setKeySkillsStr(e.target.value)}
                      placeholder="Python, Problem Solving, React"
                    />
                    <p className="text-[10px] text-muted-foreground">Separate multiple skills with commas.</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="border-t pt-3 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Professional Credentials</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Highest Qualification</Label>
                    <Input
                      value={highestQualification}
                      onChange={(e) => setHighestQualification(e.target.value)}
                      placeholder="Ph.D., M.A. Counseling"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Graduating Institution</Label>
                    <Input
                      value={counselorInst}
                      onChange={(e) => setCounselorInst(e.target.value)}
                      placeholder="Stanford University"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Certifications (comma-separated)</Label>
                    <Input
                      value={certificationsStr}
                      onChange={(e) => setCertificationsStr(e.target.value)}
                      placeholder="NBCC, Licensed Career Counselor"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">License Number (Optional)</Label>
                    <Input
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      placeholder="LCC-88491"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-3 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Specialization & Approach</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Specializations (comma-separated)</Label>
                    <Input
                      value={specializationsStr}
                      onChange={(e) => setSpecializationsStr(e.target.value)}
                      placeholder="STEM Careers, College Admissions"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Years of Experience</Label>
                    <Input
                      type="number"
                      value={yearsExperience}
                      onChange={(e) => setYearsExperience(e.target.value)}
                      placeholder="8"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Languages Spoken (comma-separated)</Label>
                  <Input
                    value={languagesStr}
                    onChange={(e) => setLanguagesStr(e.target.value)}
                    placeholder="English, Spanish, Hindi"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Bio (max 500 characters)</Label>
                  <Textarea
                    value={bio}
                    maxLength={500}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Brief professional counseling approach..."
                    rows={3}
                  />
                </div>
              </div>
            </>
          )}

          <DialogFooter className="pt-3 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="font-semibold min-w-[110px]"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" /> Saving...
                </>
              ) : (
                "Save Profile"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default ProfileEditModal;


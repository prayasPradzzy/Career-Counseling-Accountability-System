"use client";

import { useState, useEffect } from "react";
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

  useEffect(() => {
    if (profile) {
      setPhone(profile.phone || "");
      setGender(profile.gender || "prefer-not-to-say");

      if (role === "student") {
        const edu = (Array.isArray(profile.education) && profile.education[0]) || profile.academic || {};
        setInstitution(edu.institution || "");
        setDegreeProgram(edu.degreeProgram || edu.degree || "");
        setFieldOfStudy(edu.fieldOfStudy || "");
        setGraduationYear(edu.graduationYear || edu.endYear ? String(edu.graduationYear || edu.endYear) : "");

        const roles = profile.careerGoals?.targetRoles || (Array.isArray(profile.careerGoals) ? profile.careerGoals : []);
        setTargetRolesStr(roles.join(", "));

        const skills = profile.careerGoals?.keySkills || (Array.isArray(profile.skills) ? profile.skills : []);
        setKeySkillsStr(skills.join(", "));
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
    }
  }, [profile, role, open]);

  const updateMutation = useMutation({
    mutationFn: (payload) => profileService.updateMyProfile(payload),
    onSuccess: () => {
      toast.success("Profile updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["my-role-profile"] });
      onOpenChange(false);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to update profile.");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    let payload = {
      phone,
      gender,
    };

    if (role === "student") {
      payload.academic = {
        institution,
        degreeProgram,
        fieldOfStudy,
        graduationYear: graduationYear ? Number(graduationYear) : undefined,
      };
      payload.careerGoals = {
        targetRoles: targetRolesStr.split(",").map((s) => s.trim()).filter(Boolean),
        keySkills: keySkillsStr.split(",").map((s) => s.trim()).filter(Boolean),
      };
    } else {
      payload.credentials = {
        highestQualification,
        institution: counselorInst,
        certifications: certificationsStr.split(",").map((s) => s.trim()).filter(Boolean),
        licenseNumber,
      };
      payload.practice = {
        specializations: specializationsStr.split(",").map((s) => s.trim()).filter(Boolean),
        yearsExperience: yearsExperience ? Number(yearsExperience) : 0,
        languagesSpoken: languagesStr.split(",").map((s) => s.trim()).filter(Boolean),
        bio,
      };
    }

    updateMutation.mutate(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit {role === "counselor" ? "Counselor" : "Student"} Profile</DialogTitle>
          <DialogDescription>
            Update your role-specific information below. Mismatched fields are automatically strictly validated.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Shared Basic Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Phone Number</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" />
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
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Institution</Label>
                    <Input value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder="University Name" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Degree Program</Label>
                    <Input value={degreeProgram} onChange={(e) => setDegreeProgram(e.target.value)} placeholder="B.Sc, M.Sc, High School" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Field of Study</Label>
                    <Input value={fieldOfStudy} onChange={(e) => setFieldOfStudy(e.target.value)} placeholder="Computer Science" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Graduation Year</Label>
                    <Input type="number" value={graduationYear} onChange={(e) => setGraduationYear(e.target.value)} placeholder="2026" />
                  </div>
                </div>
              </div>

              <div className="border-t pt-3 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Career Goals & Skills</h4>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Target Roles (comma-separated)</Label>
                    <Input value={targetRolesStr} onChange={(e) => setTargetRolesStr(e.target.value)} placeholder="Software Engineer, Data Analyst" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Key Skills (comma-separated)</Label>
                    <Input value={keySkillsStr} onChange={(e) => setKeySkillsStr(e.target.value)} placeholder="Python, Problem Solving" />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="border-t pt-3 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Professional Credentials</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Highest Qualification</Label>
                    <Input value={highestQualification} onChange={(e) => setHighestQualification(e.target.value)} placeholder="Ph.D., M.A. Counseling" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Graduating Institution</Label>
                    <Input value={counselorInst} onChange={(e) => setCounselorInst(e.target.value)} placeholder="Stanford University" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Certifications (comma-separated)</Label>
                    <Input value={certificationsStr} onChange={(e) => setCertificationsStr(e.target.value)} placeholder="NBCC, Licensed Career Counselor" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">License Number (Optional)</Label>
                    <Input value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} placeholder="LCC-88491" />
                  </div>
                </div>
              </div>

              <div className="border-t pt-3 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Specialization & Approach</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Specializations (comma-separated)</Label>
                    <Input value={specializationsStr} onChange={(e) => setSpecializationsStr(e.target.value)} placeholder="STEM Careers, College Admissions" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Years of Experience</Label>
                    <Input type="number" value={yearsExperience} onChange={(e) => setYearsExperience(e.target.value)} placeholder="8" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Languages Spoken (comma-separated)</Label>
                  <Input value={languagesStr} onChange={(e) => setLanguagesStr(e.target.value)} placeholder="English, Spanish, Hindi" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Bio (max 500 characters)</Label>
                  <Textarea value={bio} maxLength={500} onChange={(e) => setBio(e.target.value)} placeholder="Brief professional counseling approach..." rows={3} />
                </div>
              </div>
            </>
          )}

          <DialogFooter className="pt-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending} className="font-semibold">
              {updateMutation.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : "Save Profile"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default ProfileEditModal;

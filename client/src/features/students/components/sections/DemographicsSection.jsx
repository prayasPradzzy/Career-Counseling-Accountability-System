"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useUpdateStudent } from "../../hooks/useStudents";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Info, Save, PencilLine } from "lucide-react";

/**
 * DemographicsSection — merged "Personal Info" + "Education" tab.
 *
 * A real, working editable form (the old tabs were read-only cards). Field set
 * is deliberately career-counseling relevant: identity, location, languages,
 * academic background, plus two OPTIONAL sensitive fields each carrying a short
 * "why we ask" note for transparency. Income/socioeconomic data is excluded by
 * design — collecting it needs a specific, justified counseling use case.
 */
export function DemographicsSection({ profile, studentUserId, readOnly = false }) {
  const updateMutation = useUpdateStudent();

  const userObj = profile?.userId || {};
  const primaryEdu = (Array.isArray(profile?.education) && profile.education[0]) || profile?.academic || {};

  // ── Form state (initialized once from the profile) ──────────────────────
  const [phone, setPhone] = useState(profile?.phone || "");
  const [dateOfBirth, setDateOfBirth] = useState(
    profile?.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().split("T")[0] : ""
  );
  const [gender, setGender] = useState(profile?.gender || "prefer-not-to-say");
  const [city, setCity] = useState(profile?.location?.city || "");
  const [state, setState] = useState(profile?.location?.state || "");
  const [country, setCountry] = useState(profile?.location?.country || "");
  const [languagesStr, setLanguagesStr] = useState(
    Array.isArray(profile?.languages) ? profile.languages.join(", ") : ""
  );
  const [institution, setInstitution] = useState(primaryEdu.institution || "");
  const [degreeProgram, setDegreeProgram] = useState(primaryEdu.degree || primaryEdu.degreeProgram || "");
  const [fieldOfStudy, setFieldOfStudy] = useState(primaryEdu.fieldOfStudy || "");
  const [graduationYear, setGraduationYear] = useState(
    primaryEdu.graduationYear || primaryEdu.endYear ? String(primaryEdu.graduationYear || primaryEdu.endYear) : ""
  );
  const [currentGradeYear, setCurrentGradeYear] = useState(profile?.currentGradeYear || "");
  const [firstGen, setFirstGen] = useState(
    profile?.isFirstGenerationLearner === null || profile?.isFirstGenerationLearner === undefined
      ? ""
      : profile.isFirstGenerationLearner
      ? "yes"
      : "no"
  );
  const [learningDifference, setLearningDifference] = useState(profile?.learningDifference || "");
  const [dirty, setDirty] = useState(false);

  const parseList = (str) =>
    str
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  const handleSave = () => {
    if (!studentUserId) {
      toast.error("Student account is not linked yet.");
      return;
    }

    const gradYearNum = graduationYear.trim() ? Number(graduationYear.trim()) : undefined;

    // Only send an education entry when academic fields are actually filled —
    // the schema requires institution/degree/fieldOfStudy, so an all-empty
    // entry would 400 on an otherwise-fine demographics save.
    const eduItem = {
      institution: institution.trim(),
      degree: degreeProgram.trim(),
      fieldOfStudy: fieldOfStudy.trim(),
      endYear: gradYearNum,
    };
    const hasAcademicContent = Boolean(eduItem.institution || eduItem.degree || eduItem.fieldOfStudy || gradYearNum);

    updateMutation.mutate(
      {
        id: studentUserId,
        data: {
          phone: phone.trim(),
          dateOfBirth: dateOfBirth || undefined,
          gender,
          location: {
            city: city.trim(),
            state: state.trim(),
            country: country.trim(),
          },
          languages: parseList(languagesStr),
          education: hasAcademicContent ? [eduItem] : [],
          currentGradeYear: currentGradeYear.trim(),
          isFirstGenerationLearner: firstGen === "" ? null : firstGen === "yes",
          learningDifference: learningDifference.trim(),
        },
      },
      {
        onSuccess: () => {
          toast.success("Demographics saved successfully.");
          setDirty(false);
        },
        onError: (err) => {
          toast.error(err?.response?.data?.message || "Failed to save demographics.");
        },
      }
    );
  };

  const markDirty = (setter) => (e) => {
    setter(e.target.value);
    setDirty(true);
  };

  return (
    <div className="space-y-6">
      <SectionCard
        title="Demographics"
        subtitle="Career-counseling context — collect before results for better guidance"
        iconName="UserCircle"
        action={
          !readOnly && (
            <Button
              size="sm"
              className="gap-1.5 text-xs font-semibold"
              disabled={!dirty || updateMutation.isPending}
              onClick={handleSave}
            >
              {updateMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Save className="size-3.5" />
              )}
              {updateMutation.isPending ? "Saving..." : "Save Demographics"}
            </Button>
          )
        }
      >
        <div className="space-y-6 pt-1">
          {/* ── Identity ─────────────────────────────────────────────────── */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
              Identity
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <Field label="Full Name" readOnly value={`${userObj.firstName || ""} ${userObj.lastName || ""}`.trim() || "—"} />
              <Field label="Email" readOnly value={userObj.email || "—"} />
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Phone Number</Label>
                <Input
                  value={phone}
                  disabled={readOnly}
                  onChange={markDirty(setPhone)}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Date of Birth</Label>
                <Input
                  type="date"
                  value={dateOfBirth}
                  disabled={readOnly}
                  onChange={markDirty(setDateOfBirth)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Gender Identity</Label>
                <Select
                  value={gender}
                  disabled={readOnly}
                  onValueChange={(val) => {
                    setGender(val);
                    setDirty(true);
                  }}
                >
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
          </div>

          {/* ── Location ─────────────────────────────────────────────────── */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
              Location
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">City</Label>
                <Input value={city} disabled={readOnly} onChange={markDirty(setCity)} placeholder="Mumbai" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">State / Region</Label>
                <Input value={state} disabled={readOnly} onChange={markDirty(setState)} placeholder="Maharashtra" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Country</Label>
                <Input value={country} disabled={readOnly} onChange={markDirty(setCountry)} placeholder="India" />
              </div>
            </div>
          </div>

          {/* ── Languages ────────────────────────────────────────────────── */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
              Languages Spoken
            </h4>
            <div className="space-y-1">
              <Input
                value={languagesStr}
                disabled={readOnly}
                onChange={markDirty(setLanguagesStr)}
                placeholder="English, Hindi, Marathi (comma-separated)"
              />
              <p className="text-[10px] text-muted-foreground">
                Useful for scheduling and planning interview sessions in the right language.
              </p>
            </div>
          </div>

          {/* ── Academic ─────────────────────────────────────────────────── */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
              Academic Background
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Institution</Label>
                <Input
                  value={institution}
                  disabled={readOnly}
                  onChange={markDirty(setInstitution)}
                  placeholder="High School / College / University"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Current Grade / Year</Label>
                <Input
                  value={currentGradeYear}
                  disabled={readOnly}
                  onChange={markDirty(setCurrentGradeYear)}
                  placeholder="Grade 11, 2nd Year, ..."
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Degree Program</Label>
                <Input
                  value={degreeProgram}
                  disabled={readOnly}
                  onChange={markDirty(setDegreeProgram)}
                  placeholder="High School, B.Sc, M.Sc"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Stream / Field of Study</Label>
                <Input
                  value={fieldOfStudy}
                  disabled={readOnly}
                  onChange={markDirty(setFieldOfStudy)}
                  placeholder="Science, Commerce, Computer Science"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Graduation Year</Label>
                <Input
                  type="number"
                  value={graduationYear}
                  disabled={readOnly}
                  onChange={markDirty(setGraduationYear)}
                  placeholder="2026"
                />
              </div>
            </div>
          </div>

          {/* ── Optional / sensitive (why-we-ask notes) ──────────────────── */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
              Optional Context <span className="font-normal normal-case text-[10px]">— all optional</span>
            </h4>
            <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">First-Generation Learner?</Label>
                  <Select
                    value={firstGen}
                    disabled={readOnly}
                    onValueChange={(val) => {
                      setFirstGen(val);
                      setDirty(true);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                      <SelectItem value="">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Learning Difference / Accessibility Need</Label>
                  <Input
                    value={learningDifference}
                    disabled={readOnly}
                    onChange={markDirty(setLearningDifference)}
                    placeholder="Optional — e.g. dyslexia, hearing aid"
                  />
                </div>
              </div>

              <div className="flex items-start gap-2 text-[11px] text-muted-foreground leading-relaxed">
                <Info className="size-3.5 shrink-0 mt-0.5 text-primary" />
                <p>
                  <span className="font-semibold text-foreground">Why we ask:</span>{" "}
                  first-gen status helps us frame post-secondary guidance realistically, and knowing
                  an accessibility need lets us adapt interview format and scheduling. Both are
                  completely optional — you can leave them blank or say &quot;prefer not to say&quot;
                  and it won&apos;t affect your guidance.
                </p>
              </div>
            </div>
          </div>

          {!readOnly && (
            <div className="flex justify-end pt-2 border-t border-border/50">
              <Button
                className="gap-1.5 text-xs font-semibold"
                disabled={!dirty || updateMutation.isPending}
                onClick={handleSave}
              >
                {updateMutation.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <PencilLine className="size-3.5" />
                )}
                {updateMutation.isPending ? "Saving..." : "Save Demographics"}
              </Button>
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );
}

function Field({ label, value, readOnly }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-semibold">{label}</Label>
      <div className="h-9 flex items-center rounded-lg border border-border/60 bg-muted/20 px-3 text-sm text-foreground truncate">
        {value}
      </div>
    </div>
  );
}

export default DemographicsSection;

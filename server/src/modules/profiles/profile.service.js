const User = require("../users/user.model");
const StudentProfile = require("./studentProfile.model");
const CounselorProfile = require("../counselors/counselorProfile.model");
const AssessmentSession = require("../assessments/assessmentSession.model");
const ApiError = require("../../shared/utils/ApiError");
const { calculateRoleProfileCompleteness } = require("../../shared/utils/profileCompleteness");

class ProfileService {
  /**
   * 1. Get Role-Appropriate Profile
   */
  async getProfile(user) {
    const userDoc = await User.findById(user._id).select("-passwordHash -__v");
    if (!userDoc) {
      throw new ApiError(404, "User account not found.");
    }

    let profileDoc = null;

    if (userDoc.role === "counselor" || userDoc.role === "admin") {
      profileDoc = await CounselorProfile.findOne({ userId: userDoc._id });
      if (!profileDoc) {
        // Auto-create initial CounselorProfile if missing
        profileDoc = await CounselorProfile.create({
          userId: userDoc._id,
          phone: "",
          gender: "prefer-not-to-say",
          credentials: {
            highestQualification: "",
            institution: "",
            certifications: [],
            licenseNumber: "",
          },
          practice: {
            specializations: [],
            yearsExperience: 0,
            languagesSpoken: [],
            bio: "",
          },
        });
      }
    } else {
      // Student role
      profileDoc = await StudentProfile.findOne({ userId: userDoc._id });
      if (!profileDoc) {
        profileDoc = await StudentProfile.create({
          userId: userDoc._id,
          phone: "",
          gender: "prefer-not-to-say",
          education: [],
          careerGoals: [],
          skills: [],
        });
      }
    }

    const profileObj = profileDoc.toObject();

    if (userDoc.role !== "counselor" && userDoc.role !== "admin") {
      const primaryEdu = (Array.isArray(profileObj.education) && profileObj.education[0]) || {};
      profileObj.academic = {
        institution: primaryEdu.institution || "",
        degreeProgram: primaryEdu.degree || primaryEdu.degreeProgram || "",
        fieldOfStudy: primaryEdu.fieldOfStudy || "",
        graduationYear: primaryEdu.endYear || primaryEdu.graduationYear || undefined,
      };
      profileObj.careerGoals = {
        targetRoles: Array.isArray(profileObj.careerGoals) ? profileObj.careerGoals : [],
        keySkills: Array.isArray(profileObj.skills) ? profileObj.skills : [],
      };
    }

    const completenessPercentage = calculateRoleProfileCompleteness(userDoc.role, profileObj);

    return {
      user: userDoc,
      role: userDoc.role,
      profile: profileObj,
      completenessPercentage,
    };
  }

  /**
   * 2. Update Role-Appropriate Profile with Strict Schema Validation
   */
  async updateProfile(user, data) {
    const userDoc = await User.findById(user._id);
    if (!userDoc) {
      throw new ApiError(404, "User account not found.");
    }

    const fieldErrors = {};

    // Validate Phone Number if provided
    if (data.phone !== undefined && data.phone !== null && data.phone.trim() !== "") {
      const cleanPhone = data.phone.trim();
      const phoneRegex = /^\+?[0-9\s\-().]{7,20}$/;
      if (!phoneRegex.test(cleanPhone)) {
        fieldErrors.phone = "Please enter a valid phone number (7-20 digits).";
      }
    }

    // Role-specific Strict Schema Validation: Reject mismatched fields
    if (userDoc.role === "counselor" || userDoc.role === "admin") {
      const studentOnlyKeys = ["academic", "education", "careerGoals", "targetRoles", "skills", "guardianInfo", "consentStatus"];
      const invalidKeys = studentOnlyKeys.filter((k) => Object.prototype.hasOwnProperty.call(data, k));
      if (invalidKeys.length > 0) {
        throw new ApiError(
          400,
          `Counselor profile cannot set student-only fields: ${invalidKeys.join(", ")}.`
        );
      }

      if (Object.keys(fieldErrors).length > 0) {
        throw new ApiError(400, "Validation failed for counselor profile.", fieldErrors);
      }

      let profileDoc = await CounselorProfile.findOne({ userId: userDoc._id });
      if (!profileDoc) {
        profileDoc = new CounselorProfile({ userId: userDoc._id });
      }

      if (data.phone !== undefined) profileDoc.phone = data.phone.trim();
      if (data.gender !== undefined) profileDoc.gender = data.gender;

      if (data.credentials) {
        if (data.credentials.highestQualification !== undefined)
          profileDoc.credentials.highestQualification = data.credentials.highestQualification.trim();
        if (data.credentials.institution !== undefined)
          profileDoc.credentials.institution = data.credentials.institution.trim();
        if (Array.isArray(data.credentials.certifications))
          profileDoc.credentials.certifications = data.credentials.certifications.map((s) => String(s).trim()).filter(Boolean);
        if (data.credentials.licenseNumber !== undefined)
          profileDoc.credentials.licenseNumber = data.credentials.licenseNumber.trim();
      }

      if (data.practice) {
        if (Array.isArray(data.practice.specializations))
          profileDoc.practice.specializations = data.practice.specializations.map((s) => String(s).trim()).filter(Boolean);
        if (typeof data.practice.yearsExperience === "number")
          profileDoc.practice.yearsExperience = data.practice.yearsExperience;
        if (Array.isArray(data.practice.languagesSpoken))
          profileDoc.practice.languagesSpoken = data.practice.languagesSpoken.map((s) => String(s).trim()).filter(Boolean);
        if (data.practice.bio !== undefined)
          profileDoc.practice.bio = data.practice.bio.trim();
      }

      await profileDoc.save();
      return await this.getProfile(userDoc);
    } else {
      // Student role
      const counselorOnlyKeys = ["credentials", "practice", "specializations", "yearsExperience", "licenseNumber", "bio"];
      const invalidKeys = counselorOnlyKeys.filter((k) => Object.prototype.hasOwnProperty.call(data, k));
      if (invalidKeys.length > 0) {
        throw new ApiError(
          400,
          `Student profile cannot set counselor-only fields: ${invalidKeys.join(", ")}.`
        );
      }

      // Validate Graduation Year if provided
      if (data.academic) {
        const gradYear = data.academic.graduationYear;
        if (gradYear !== undefined && gradYear !== null && String(gradYear).trim() !== "") {
          const gradYearNum = Number(gradYear);
          const currentYear = new Date().getFullYear();
          if (
            isNaN(gradYearNum) ||
            !Number.isInteger(gradYearNum) ||
            gradYearNum < 1950 ||
            gradYearNum > 2100 ||
            gradYearNum < currentYear - 2 ||
            gradYearNum > currentYear + 15
          ) {
            fieldErrors.graduationYear = `Graduation year must be a valid 4-digit year between ${currentYear - 2} and ${currentYear + 15}.`;
          }
        }
      }

      if (Object.keys(fieldErrors).length > 0) {
        throw new ApiError(400, "Validation failed for student profile.", fieldErrors);
      }

      let profileDoc = await StudentProfile.findOne({ userId: userDoc._id });
      if (!profileDoc) {
        profileDoc = new StudentProfile({ userId: userDoc._id });
      }

      if (data.phone !== undefined) profileDoc.phone = data.phone.trim();
      if (data.gender !== undefined) profileDoc.gender = data.gender;

      // Demographics expansion (optional fields — blank/null is respected)
      if (data.location && typeof data.location === "object") {
        profileDoc.location = {
          city: String(data.location.city || "").trim(),
          state: String(data.location.state || "").trim(),
          country: String(data.location.country || "").trim(),
        };
      }
      if (data.isFirstGenerationLearner !== undefined) {
        profileDoc.isFirstGenerationLearner =
          data.isFirstGenerationLearner === null
            ? null
            : Boolean(data.isFirstGenerationLearner);
      }
      if (data.currentGradeYear !== undefined) {
        profileDoc.currentGradeYear = String(data.currentGradeYear || "").trim();
      }
      if (data.learningDifference !== undefined) {
        profileDoc.learningDifference = String(data.learningDifference || "").trim();
      }

      // Handle academic / education object or arrays
      if (data.academic) {
        const gradYearVal = data.academic.graduationYear ? Number(data.academic.graduationYear) : undefined;
        const eduItem = {
          institution: (data.academic.institution || "").trim(),
          degree: (data.academic.degreeProgram || "").trim(),
          fieldOfStudy: (data.academic.fieldOfStudy || "").trim(),
          endYear: gradYearVal,
        };
        profileDoc.education = [eduItem];
      } else if (Array.isArray(data.education)) {
        profileDoc.education = data.education;
      }

      // Handle career goals / skills object or arrays
      if (data.careerGoals && typeof data.careerGoals === "object" && !Array.isArray(data.careerGoals)) {
        if (Array.isArray(data.careerGoals.targetRoles)) {
          profileDoc.careerGoals = data.careerGoals.targetRoles.map((s) => String(s).trim()).filter(Boolean);
        }
        if (Array.isArray(data.careerGoals.keySkills)) {
          profileDoc.skills = data.careerGoals.keySkills.map((s) => String(s).trim()).filter(Boolean);
        }
      } else if (Array.isArray(data.careerGoals)) {
        profileDoc.careerGoals = data.careerGoals.map((s) => String(s).trim()).filter(Boolean);
      }

      if (Array.isArray(data.skills)) {
        profileDoc.skills = data.skills.map((s) => String(s).trim()).filter(Boolean);
      }

      await profileDoc.save();
      return await this.getProfile(userDoc);
    }
  }

  /**
   * 3. Get Dynamic Completeness Percentage
   */
  async getCompleteness(user) {
    const full = await this.getProfile(user);
    return {
      role: full.role,
      completenessPercentage: full.completenessPercentage,
    };
  }

  /**
   * 4. Get Counselor Caseload Summary (Computed Live)
   */
  async getCounselorCaseload(user) {
    if (user.role !== "counselor" && user.role !== "admin") {
      throw new ApiError(403, "Only counselors and administrators can view caseload metrics.");
    }

    // Active assigned students
    const activeStudents = await StudentProfile.countDocuments({
      assignedCounselorId: user._id,
      status: { $ne: "archived" },
    });

    // Completed sessions for assigned students
    const assignedProfiles = await StudentProfile.find({ assignedCounselorId: user._id }).select("userId");
    const studentUserIds = assignedProfiles.map((p) => p.userId).filter(Boolean);

    const sessionsCompleted = await AssessmentSession.countDocuments({
      clientId: { $in: studentUserIds },
      status: { $in: ["completed", "submitted", "reviewed", "approved"] },
    });

    // Active unactivated invite codes created by this counselor
    const inviteCodesActive = await StudentProfile.countDocuments({
      invitedBy: user._id,
      userId: null,
      invitationExpiresAt: { $gt: new Date() },
    });

    // Used invite codes (activated student accounts)
    const inviteCodesUsed = await StudentProfile.countDocuments({
      invitedBy: user._id,
      userId: { $ne: null },
    });

    return {
      activeStudents,
      sessionsCompleted,
      inviteCodesActive,
      inviteCodesUsed,
    };
  }
}

module.exports = new ProfileService();

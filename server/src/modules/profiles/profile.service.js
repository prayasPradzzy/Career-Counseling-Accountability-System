const User = require("../users/user.model");
const ClientProfile = require("./clientProfile.model");
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
      profileDoc = await ClientProfile.findOne({ userId: userDoc._id });
      if (!profileDoc) {
        profileDoc = await ClientProfile.create({
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

      let profileDoc = await CounselorProfile.findOne({ userId: userDoc._id });
      if (!profileDoc) {
        profileDoc = new CounselorProfile({ userId: userDoc._id });
      }

      if (data.phone !== undefined) profileDoc.phone = data.phone;
      if (data.gender !== undefined) profileDoc.gender = data.gender;

      if (data.credentials) {
        if (data.credentials.highestQualification !== undefined)
          profileDoc.credentials.highestQualification = data.credentials.highestQualification;
        if (data.credentials.institution !== undefined)
          profileDoc.credentials.institution = data.credentials.institution;
        if (Array.isArray(data.credentials.certifications))
          profileDoc.credentials.certifications = data.credentials.certifications;
        if (data.credentials.licenseNumber !== undefined)
          profileDoc.credentials.licenseNumber = data.credentials.licenseNumber;
      }

      if (data.practice) {
        if (Array.isArray(data.practice.specializations))
          profileDoc.practice.specializations = data.practice.specializations;
        if (typeof data.practice.yearsExperience === "number")
          profileDoc.practice.yearsExperience = data.practice.yearsExperience;
        if (Array.isArray(data.practice.languagesSpoken))
          profileDoc.practice.languagesSpoken = data.practice.languagesSpoken;
        if (data.practice.bio !== undefined)
          profileDoc.practice.bio = data.practice.bio;
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

      let profileDoc = await ClientProfile.findOne({ userId: userDoc._id });
      if (!profileDoc) {
        profileDoc = new ClientProfile({ userId: userDoc._id });
      }

      if (data.phone !== undefined) profileDoc.phone = data.phone;
      if (data.gender !== undefined) profileDoc.gender = data.gender;

      // Handle academic / education object or arrays
      if (data.academic) {
        const eduItem = {
          institution: data.academic.institution || "",
          degree: data.academic.degreeProgram || "",
          fieldOfStudy: data.academic.fieldOfStudy || "",
          endYear: data.academic.graduationYear || undefined,
        };
        profileDoc.education = [eduItem];
      } else if (Array.isArray(data.education)) {
        profileDoc.education = data.education;
      }

      // Handle career goals / skills object or arrays
      if (data.careerGoals && typeof data.careerGoals === "object" && !Array.isArray(data.careerGoals)) {
        if (Array.isArray(data.careerGoals.targetRoles)) {
          profileDoc.careerGoals = data.careerGoals.targetRoles;
        }
        if (Array.isArray(data.careerGoals.keySkills)) {
          profileDoc.skills = data.careerGoals.keySkills;
        }
      } else if (Array.isArray(data.careerGoals)) {
        profileDoc.careerGoals = data.careerGoals;
      }

      if (Array.isArray(data.skills)) {
        profileDoc.skills = data.skills;
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
    const activeStudents = await ClientProfile.countDocuments({
      assignedCounselorId: user._id,
      status: { $ne: "archived" },
    });

    // Completed sessions for assigned students
    const assignedProfiles = await ClientProfile.find({ assignedCounselorId: user._id }).select("userId");
    const studentUserIds = assignedProfiles.map((p) => p.userId).filter(Boolean);

    const sessionsCompleted = await AssessmentSession.countDocuments({
      clientId: { $in: studentUserIds },
      status: { $in: ["completed", "submitted", "reviewed", "approved"] },
    });

    // Active unactivated invite codes created by this counselor
    const inviteCodesActive = await ClientProfile.countDocuments({
      invitedBy: user._id,
      userId: null,
      invitationExpiresAt: { $gt: new Date() },
    });

    // Used invite codes (activated student accounts)
    const inviteCodesUsed = await ClientProfile.countDocuments({
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

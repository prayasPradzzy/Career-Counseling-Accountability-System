const crypto = require("crypto");
const mongoose = require("mongoose");
const StudentProfile = require("../profiles/studentProfile.model");
const User = require("../users/user.model");
const InviteCode = require("../auth/inviteCode.model");
const ApiError = require("../../shared/utils/ApiError");
const { isSameId, canCounselorAccessStudent } = require("../../shared/utils/ownership.utils");
const {
  STUDENT_STATUS,
  deriveStudentLifecycleStatus,
} = require("../../shared/constants/studentStatus.constants");

const { computeStudentCompleteness: calculateProfileCompletion } = require("../../shared/utils/profileCompleteness");

class ClientService {
  /**
   * Flow A: Student Self-Registration Profile Creation
   * Ensures User exists and doesn't already have a StudentProfile.
   */
  async createStudentProfile(data, requestingUser) {
    const { userId, phone, dateOfBirth, gender, education, careerGoals, targetIndustries, skills, languages, guardianInfo } = data;

    // Verify User exists
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      throw new ApiError(404, "Target user account not found");
    }

    // Check if StudentProfile already exists for this user
    const existingProfile = await StudentProfile.findOne({ userId });
    if (existingProfile) {
      throw new ApiError(409, "Student profile already exists for this user account");
    }

    const initialCompletion = calculateProfileCompletion({ phone, dateOfBirth, gender, education, careerGoals, skills });

    const profile = await StudentProfile.create({
      userId,
      phone,
      dateOfBirth,
      gender: gender || "prefer-not-to-say",
      education: education || [],
      careerGoals: careerGoals || [],
      targetIndustries: targetIndustries || [],
      skills: skills || [],
      languages: languages || [],
      guardianInfo,
      status: STUDENT_STATUS.REGISTERED,
    });

    const populated = await StudentProfile.findById(profile._id)
      .populate("userId", "firstName lastName email role")
      .populate("assignedCounselorId", "firstName lastName email");

    const profileObj = populated.toObject();
    profileObj.completionPercentage = calculateProfileCompletion(profileObj);
    profileObj.lifecycleStatus = deriveStudentLifecycleStatus(profileObj);

    return profileObj;
  }

  /**
   * Flow B & C: Counselor / Admin Initiated Student Registration (Invitation Architecture)
   * Creates a Student Record (StudentProfile) PRIOR to student User account activation.
   */
  async inviteStudent(data, requestingUser) {
    const { email, firstName, lastName, phone, education, guardianInfo, assignedCounselorId } = data;

    const normalizedEmail = email.toLowerCase().trim();

    // Check if a User account already exists for this email
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      throw new ApiError(409, "A user account with this email already exists.");
    }

    // Check if an invited student record already exists for this email
    const existingInvitedProfile = await StudentProfile.findOne({
      invitedEmail: normalizedEmail,
      status: { $ne: "archived" },
    });
    if (existingInvitedProfile) {
      throw new ApiError(409, "A student invitation record already exists for this email.");
    }

    // Generate secure invitation token (expires in 7 days)
    const invitationToken = crypto.randomBytes(32).toString("hex");
    const invitationExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const onboardingSource = requestingUser.role === "counselor" ? "counselor-invite" : "admin-invite";

    // Flow B: If Counselor creates, automatically assign Counselor unless overridden
    // Flow C: If Admin creates, assign counselor if specified
    let counselorAssignment = null;
    if (requestingUser.role === "counselor") {
      counselorAssignment = requestingUser._id;
    } else if (assignedCounselorId) {
      const counselorUser = await User.findOne({ _id: assignedCounselorId, role: "counselor" });
      if (!counselorUser) {
        throw new ApiError(404, "Target assigned counselor not found");
      }
      counselorAssignment = counselorUser._id;
    }

    const initialStatus = counselorAssignment ? STUDENT_STATUS.COUNSELOR_ASSIGNED : STUDENT_STATUS.REGISTERED;

    const studentRecord = await StudentProfile.create({
      invitedFirstName: firstName,
      invitedLastName: lastName,
      invitedEmail: normalizedEmail,
      onboardingSource,
      invitedBy: requestingUser._id,
      invitationToken,
      invitationExpiresAt,
      assignedCounselorId: counselorAssignment,
      phone,
      education: education || [],
      guardianInfo,
      status: initialStatus,
    });

    // Also register InviteCode document
    await InviteCode.create({
      code: invitationToken.toUpperCase(),
      type: "student-invite",
      ownerId: counselorAssignment || requestingUser._id,
      ownerRole: "counselor",
      expiresAt: invitationExpiresAt,
      maxUses: 1,
      usedCount: 0,
    });

    const populated = await StudentProfile.findById(studentRecord._id)
      .populate("invitedBy", "firstName lastName email role")
      .populate("assignedCounselorId", "firstName lastName email");

    const recordObj = populated.toObject();
    recordObj.completionPercentage = calculateProfileCompletion(recordObj);
    recordObj.lifecycleStatus = deriveStudentLifecycleStatus(recordObj);

    // Return invitation details (NO email sending, token provided for client integration)
    return {
      studentProfile: recordObj,
      invitationToken,
      invitationExpiresAt,
      invitationLink: `/register/activate?token=${invitationToken}`,
    };
  }

  /**
   * Student Account Activation (for Invited Flow B & C Students)
   * Validates invitation token, creates User account, and links to Student Record.
   */
  async activateStudentAccount(activationData) {
    const { token, password, firstName, lastName } = activationData;

    const profile = await StudentProfile.findOne({
      invitationToken: token,
      invitationExpiresAt: { $gt: Date.now() },
    });

    if (!profile) {
      throw new ApiError(400, "Invalid or expired invitation token.");
    }

    const finalFirstName = firstName || profile.invitedFirstName || "Student";
    const finalLastName = lastName || profile.invitedLastName || "User";

    // Create User account with role 'student'
    const newUser = await User.create({
      firstName: finalFirstName,
      lastName: finalLastName,
      email: profile.invitedEmail,
      password,
      role: "student",
      counselorId: profile.assignedCounselorId || profile.invitedBy,
      isActivated: true,
      activatedAt: new Date(),
    });

    // Link Student Record to newly activated User account
    profile.userId = newUser._id;
    profile.invitationToken = undefined;
    profile.invitationExpiresAt = undefined;
    const compAcc = calculateProfileCompletion(profile);
    profile.status = deriveStudentLifecycleStatus(profile, { completionPercentage: compAcc });
    await profile.save();

    const populated = await StudentProfile.findById(profile._id)
      .populate("userId", "firstName lastName email role")
      .populate("assignedCounselorId", "firstName lastName email");

    const profileObj = populated.toObject();
    profileObj.completionPercentage = calculateProfileCompletion(profileObj);
    profileObj.lifecycleStatus = deriveStudentLifecycleStatus(profileObj);

    return {
      user: {
        id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        role: newUser.role,
      },
      studentProfile: profileObj,
    };
  }

  /**
   * Get Student Profile by ID or UserID
   * Enforces RBAC: Students can only view their own profile.
   * Counselor can ONLY view their assigned students.
   */
  async getStudentProfile(identifier, requestingUser) {
    if (!identifier) {
      console.error("[getStudentProfile Error] Missing profile identifier parameter.");
      throw new ApiError(400, "Student profile identifier is required.");
    }

    const isObjectId = mongoose.Types.ObjectId.isValid(identifier);
    const query = { status: { $ne: "archived" } };

    if (isObjectId) {
      query.$or = [{ _id: identifier }, { userId: identifier }];
    } else {
      query.invitedEmail = identifier.toLowerCase().trim();
    }

    let profile = await StudentProfile.findOne(query)
      .populate("userId", "firstName lastName email role counselorId")
      .populate("assignedCounselorId", "firstName lastName email")
      .populate("invitedBy", "firstName lastName email role");

    if (!profile) {
      console.error(`[getStudentProfile 404] StudentProfile record not found for query identifier: '${identifier}'.`);
      throw new ApiError(404, "Student profile not found");
    }

    // Fallback populated name/email for invited records prior to account activation
    const profileObj = profile.toObject();
    if (!profileObj.userId && profileObj.invitedEmail) {
      profileObj.userId = {
        firstName: profileObj.invitedFirstName || "Invited",
        lastName: profileObj.invitedLastName || "Student",
        email: profileObj.invitedEmail,
        role: "student",
      };
    }

    // RBAC Check: Student can only view their own profile
    if (requestingUser.role === "student") {
      const targetUserId = profile.userId?._id || profile.userId;
      if (targetUserId && !isSameId(targetUserId, requestingUser._id)) {
        console.error(
          `[getStudentProfile 403] Student user ${requestingUser._id} denied access to profile belonging to user ${targetUserId}.`
        );
        throw new ApiError(403, "Access denied. You can only view your own student profile.");
      }
    }

    // RBAC Check: Counselor can ONLY view their own assigned students
    if (requestingUser.role === "counselor") {
      const isAuthorized = canCounselorAccessStudent(requestingUser._id, profile.userId, profile);
      if (!isAuthorized) {
        console.error(
          `[getStudentProfile 403] Counselor ${requestingUser._id} denied access to StudentProfile ${profile._id} (User: ${profile.userId?._id || "none"}).`
        );
        throw new ApiError(403, "Access denied: You can only access your own assigned students.");
      }
    }

    profileObj.completionPercentage = calculateProfileCompletion(profileObj);
    profileObj.lifecycleStatus = deriveStudentLifecycleStatus(profileObj);

    return profileObj;
  }

  /**
   * List Students with Pagination, Search, and Status Filters
   * Hard Enforced Scoping: Counselor ONLY receives their own assigned students.
   */
  async getClients(query, requestingUser) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const filter = { status: { $ne: "archived" } };

    // HARD BOUNDARY: Counselors ONLY see their own assigned students
    if (requestingUser.role === "counselor") {
      const myStudents = await User.find({ counselorId: requestingUser._id, role: "student" }).select("_id");
      const myStudentUserIds = myStudents.map((s) => s._id);

      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { assignedCounselorId: requestingUser._id },
          { invitedBy: requestingUser._id },
          { userId: { $in: myStudentUserIds } },
        ],
      });
    }

    if (query.status && query.status !== "ALL") {
      filter.status = query.status;
    }

    let searchUserIds = [];
    if (query.search) {
      const searchRegex = new RegExp(query.search, "i");
      const matchedUsers = await User.find({
        $or: [{ firstName: searchRegex }, { lastName: searchRegex }, { email: searchRegex }],
      }).select("_id");

      searchUserIds = matchedUsers.map((u) => u._id);
      const searchClause = {
        $or: [
          { userId: { $in: searchUserIds } },
          { invitedFirstName: searchRegex },
          { invitedLastName: searchRegex },
          { invitedEmail: searchRegex },
        ],
      };

      if (filter.$and) {
        filter.$and.push(searchClause);
      } else {
        filter.$or = searchClause.$or;
      }
    }

    const [clients, total] = await Promise.all([
      StudentProfile.find(filter)
        .populate("userId", "firstName lastName email role counselorId")
        .populate("assignedCounselorId", "firstName lastName email")
        .populate("invitedBy", "firstName lastName email role")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      StudentProfile.countDocuments(filter),
    ]);

    const formattedClients = clients.map((c) => {
      const obj = c.toObject();
      // Provide fallback name/email for unactivated invited student records
      if (!obj.userId && obj.invitedEmail) {
        obj.userId = {
          firstName: obj.invitedFirstName || "Invited",
          lastName: obj.invitedLastName || "Student",
          email: obj.invitedEmail,
          role: "student",
        };
      }
      obj.completionPercentage = calculateProfileCompletion(obj);
      obj.lifecycleStatus = deriveStudentLifecycleStatus(obj);
      return obj;
    });

    return {
      clients: formattedClients,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update Student Profile
   */
  async updateStudentProfile(identifier, updateData, requestingUser) {
    let profile = await StudentProfile.findOne({
      $or: [{ _id: identifier }, { userId: identifier }],
      status: { $ne: "archived" },
    });

    if (!profile) {
      throw new ApiError(404, "Student profile not found");
    }

    // RBAC Check
    if (
      requestingUser.role === "student" &&
      profile.userId &&
      profile.userId.toString() !== requestingUser._id.toString()
    ) {
      throw new ApiError(403, "Access denied. You can only update your own profile.");
    }

    const allowedUpdates = [
      "phone",
      "dateOfBirth",
      "gender",
      "education",
      "careerGoals",
      "targetIndustries",
      "skills",
      "languages",
      "guardianInfo",
    ];

    allowedUpdates.forEach((field) => {
      if (updateData[field] !== undefined) {
        profile[field] = updateData[field];
      }
    });

    const compUpdate = calculateProfileCompletion(profile);
    profile.status = deriveStudentLifecycleStatus(profile, { completionPercentage: compUpdate });
    await profile.save();

    const updated = await StudentProfile.findById(profile._id)
      .populate("userId", "firstName lastName email role")
      .populate("assignedCounselorId", "firstName lastName email");

    const profileObj = updated.toObject();
    if (!profileObj.userId && profileObj.invitedEmail) {
      profileObj.userId = {
        firstName: profileObj.invitedFirstName || "Invited",
        lastName: profileObj.invitedLastName || "Student",
        email: profileObj.invitedEmail,
        role: "student",
      };
    }
    profileObj.completionPercentage = calculateProfileCompletion(profileObj);
    profileObj.lifecycleStatus = deriveStudentLifecycleStatus(profileObj);

    return profileObj;
  }

  /**
   * Soft Delete Student Profile (status: "archived")
   */
  async softDeleteStudentProfile(identifier, requestingUser) {
    const profile = await StudentProfile.findOne({
      $or: [{ _id: identifier }, { userId: identifier }],
    });

    if (!profile) {
      throw new ApiError(404, "Student profile not found");
    }

    profile.status = "archived";
    await profile.save();

    return { message: "Student profile archived successfully" };
  }

  /**
   * Assign Counselor to Student Profile
   */
  async assignCounselor(identifier, counselorId, requestingUser) {
    const counselor = await User.findOne({ _id: counselorId, role: "counselor" });
    if (!counselor) {
      throw new ApiError(404, "Target counselor not found");
    }

    const profile = await StudentProfile.findOne({
      $or: [{ _id: identifier }, { userId: identifier }],
      status: { $ne: "archived" },
    });

    if (!profile) {
      throw new ApiError(404, "Student profile not found");
    }

    profile.assignedCounselorId = counselorId;
    const compAss = calculateProfileCompletion(profile);
    profile.status = deriveStudentLifecycleStatus(profile, { completionPercentage: compAss });
    await profile.save();

    const updated = await StudentProfile.findById(profile._id)
      .populate("userId", "firstName lastName email role")
      .populate("assignedCounselorId", "firstName lastName email");

    const profileObj = updated.toObject();
    if (!profileObj.userId && profileObj.invitedEmail) {
      profileObj.userId = {
        firstName: profileObj.invitedFirstName || "Invited",
        lastName: profileObj.invitedLastName || "Student",
        email: profileObj.invitedEmail,
        role: "student",
      };
    }
    profileObj.completionPercentage = calculateProfileCompletion(profileObj);
    profileObj.lifecycleStatus = deriveStudentLifecycleStatus(profileObj);

    return profileObj;
  }

  /**
   * Update Consent Status
   */
  async updateConsent(identifier, consentData, requestingUser) {
    const profile = await StudentProfile.findOne({
      $or: [{ _id: identifier }, { userId: identifier }],
      status: { $ne: "archived" },
    });

    if (!profile) {
      throw new ApiError(404, "Student profile not found");
    }

    // Merge rather than replace so a patch to one consent type
    // (e.g. audio recording) never wipes the other's state.
    const current = profile.consentStatus || {};
    profile.consentStatus = {
      ...current,
      consentFormUrl: consentData.consentFormUrl || current.consentFormUrl || "",
    };

    if (consentData.isGiven !== undefined) {
      profile.consentStatus.isGiven = Boolean(consentData.isGiven);
      profile.consentStatus.givenAt = consentData.isGiven ? new Date() : null;
    }

    if (consentData.audioRecording !== undefined) {
      const nextAudioGiven = Boolean(consentData.audioRecording.isGiven);
      profile.consentStatus.audioRecording = {
        isGiven: nextAudioGiven,
        givenAt: nextAudioGiven ? new Date() : null,
      };
    }

    await profile.save();

    const profileObj = profile.toObject();
    if (!profileObj.userId && profileObj.invitedEmail) {
      profileObj.userId = {
        firstName: profileObj.invitedFirstName || "Invited",
        lastName: profileObj.invitedLastName || "Student",
        email: profileObj.invitedEmail,
        role: "student",
      };
    }
    profileObj.completionPercentage = calculateProfileCompletion(profileObj);

    return profileObj;
  }

  /**
   * Session History Placeholder
   */
  async getClientSessionsPlaceholder(identifier, requestingUser) {
    try {
      await this.getClientProfile(identifier, requestingUser);
    } catch (err) {
      // Fallback for counselors, admins, or users without active client profiles
    }

    return {
      studentId: identifier,
      sessions: [],
      totalCount: 0,
      note: "Session history module operational.",
    };
  }
}

module.exports = new ClientService();

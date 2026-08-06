const User = require("../users/user.model");
const StudentProfile = require("../profiles/studentProfile.model");
const CounselorProfile = require("../counselors/counselorProfile.model");
const InviteCode = require("./inviteCode.model");
const ApiError = require("../../shared/utils/ApiError");
const { generateUniqueInviteCode } = require("../../shared/utils/inviteCodeGenerator");

/**
 * Strategy 1: Counselor Signup
 * Creates User + CounselorProfile + Standing InviteCode in the SAME operation.
 */
async function handleCounselorSignup(userData) {
  const { firstName, lastName, email, password } = userData;

  const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
  if (existingUser) {
    throw new ApiError(409, "email_already_exists");
  }

  const user = await User.create({
    firstName,
    lastName,
    email: email.toLowerCase().trim(),
    password,
    role: "counselor",
  });

  await CounselorProfile.create({
    userId: user._id,
    phone: "",
    gender: "prefer-not-to-say",
  });

  // Auto-create persistent standing invite code for this counselor
  const code = await generateUniqueInviteCode();
  const inviteDoc = await InviteCode.create({
    code,
    type: "student-invite",
    ownerId: user._id,
    ownerRole: "counselor",
    active: true,
    maxUses: null, // Unlimited standing code
    expiresAt: null, // No expiry
  });

  const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";

  const userObj = user.toObject();
  delete userObj.password;
  userObj.inviteCode = {
    code: inviteDoc.code,
    link: `${clientUrl}/signup?code=${inviteDoc.code}`,
  };

  return userObj;
}

/**
 * Strategy 2: Student Signup (ONLY via valid active invite code)
 */
async function handleStudentSignup(userData) {
  const { firstName, lastName, email, password, code } = userData;

  if (!code || typeof code !== "string" || code.trim().length === 0) {
    throw new ApiError(400, "invite_code_required");
  }

  const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
  if (existingUser) {
    throw new ApiError(409, "email_already_exists");
  }

  const formattedCode = code.trim().toUpperCase();
  const invite = await InviteCode.findOne({ code: formattedCode });

  // Code must exist AND be active
  if (!invite || invite.active === false) {
    throw new ApiError(400, "invite_code_invalid");
  }

  if (invite.type !== "student-invite") {
    throw new ApiError(400, "invite_code_type_mismatch");
  }

  if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
    throw new ApiError(400, "invite_code_expired");
  }

  if (invite.maxUses !== null && invite.usedCount >= invite.maxUses) {
    throw new ApiError(400, "invite_code_exhausted");
  }

  // Atomic race-safe increment
  const updateQuery = {
    _id: invite._id,
    active: true,
  };

  if (invite.maxUses !== null) {
    updateQuery.$expr = { $lt: ["$usedCount", invite.maxUses] };
  }

  const updatedInvite = await InviteCode.findOneAndUpdate(
    updateQuery,
    { $inc: { usedCount: 1 } },
    { returnDocument: "after" }
  );

  if (!updatedInvite) {
    throw new ApiError(400, "invite_code_exhausted");
  }

  // Create User with counselorId SET IMMEDIATELY IN THE SAME WRITE OPERATION!
  const user = await User.create({
    firstName,
    lastName,
    email: email.toLowerCase().trim(),
    password,
    role: "student",
    counselorId: updatedInvite.ownerId,
  });

  // Create StudentProfile linked to user and counselor
  await StudentProfile.create({
    userId: user._id,
    assignedCounselorId: updatedInvite.ownerId,
    onboardingSource: "counselor-invite",
    invitedBy: updatedInvite.ownerId,
  });

  const userObj = user.toObject();
  delete userObj.password;
  return userObj;
}

/**
 * Strategy 3: Parent Signup (Not yet built per scope)
 */
async function handleParentSignup() {
  throw new ApiError(501, "parent_signup_unavailable");
}

const signupStrategies = {
  counselor: handleCounselorSignup,
  student: handleStudentSignup,
  parent: handleParentSignup,
};

module.exports = signupStrategies;

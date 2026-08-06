const ApiError = require("../utils/ApiError");
const User = require("../../modules/users/user.model");
const ClientProfile = require("../../modules/profiles/clientProfile.model");

/**
 * Scoping Middleware: scopeToOwnStudents
 * Attaches req.studentFilter to automatically restrict counselor queries to their own assigned students.
 * Admin role bypasses filter (req.studentFilter = {})
 * Counselor role restricts to students where counselorId === req.user._id or assignedCounselorId === req.user._id
 */
const scopeToOwnStudents = (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(401, "Authentication required."));
  }

  if (req.user.role === "admin") {
    req.studentFilter = {};
    return next();
  }

  if (req.user.role === "counselor") {
    req.studentFilter = {
      $or: [
        { counselorId: req.user._id },
        { assignedCounselorId: req.user._id },
        { invitedBy: req.user._id },
      ],
    };
    return next();
  }

  return next(new ApiError(403, "Access denied: Only counselors and administrators can access student records."));
};

/**
 * Scoping Middleware: scopeToOwnCounselor
 * Restricts student queries to their own assigned counselor.
 * Admin role bypasses restriction.
 */
const scopeToOwnCounselor = (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(401, "Authentication required."));
  }

  if (req.user.role === "admin") {
    req.allowedCounselorId = null; // Bypassed for admin
    return next();
  }

  if (req.user.role === "student") {
    if (!req.user.counselorId) {
      return next(new ApiError(403, "Access denied: No assigned counselor found for your student account."));
    }
    req.allowedCounselorId = req.user.counselorId.toString();
    return next();
  }

  return next(new ApiError(403, "Access denied."));
};

/**
 * Helper utility to verify counselor ownership of a target student user or client profile.
 * Throws 403 ApiError if requesting user is a counselor and student does not belong to them.
 */
const verifyCounselorStudentOwnership = async (requestingUser, studentUserIdOrProfileId) => {
  if (requestingUser.role === "admin") {
    return true; // Admin bypass
  }

  if (requestingUser.role !== "counselor") {
    throw new ApiError(403, "Access denied: Only counselors and administrators can access student data.");
  }

  const requestingCounselorId = requestingUser._id.toString();

  // Try checking User document first
  const targetUser = await User.findById(studentUserIdOrProfileId);
  if (targetUser && targetUser.role === "student") {
    if (targetUser.counselorId && targetUser.counselorId.toString() === requestingCounselorId) {
      return true;
    }
  }

  // Try checking ClientProfile document
  const clientProfile = await ClientProfile.findOne({
    $or: [{ _id: studentUserIdOrProfileId }, { userId: studentUserIdOrProfileId }],
  });

  if (clientProfile) {
    const assignedId = clientProfile.assignedCounselorId ? clientProfile.assignedCounselorId.toString() : null;
    const invitedById = clientProfile.invitedBy ? clientProfile.invitedBy.toString() : null;

    if (assignedId === requestingCounselorId || invitedById === requestingCounselorId) {
      return true;
    }
  }

  throw new ApiError(403, "Access denied: You do not have permission to access or modify this student record.");
};

module.exports = {
  scopeToOwnStudents,
  scopeToOwnCounselor,
  verifyCounselorStudentOwnership,
};

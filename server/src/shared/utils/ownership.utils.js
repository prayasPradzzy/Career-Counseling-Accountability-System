/**
 * ownership.utils.js — Unifies ID comparisons and counselor-student relationship checks.
 */

/**
 * Safely compares two IDs (handles strings, Mongoose ObjectIds, or populated documents).
 * Returns true if both represent the exact same stringified ID.
 */
const isSameId = (id1, id2) => {
  if (!id1 || !id2) return false;
  const str1 = typeof id1 === "object" && id1._id ? id1._id.toString() : id1.toString();
  const str2 = typeof id2 === "object" && id2._id ? id2._id.toString() : id2.toString();
  return str1 === str2;
};

/**
 * Verifies if a given counselor ID is authorized to access a student record.
 * Checks User.counselorId, StudentProfile.assignedCounselorId, and StudentProfile.invitedBy.
 */
const canCounselorAccessStudent = (counselorId, studentUser, studentProfile) => {
  if (!counselorId) return false;

  // 1. Direct link on User document (counselorId)
  if (studentUser && studentUser.counselorId && isSameId(studentUser.counselorId, counselorId)) {
    return true;
  }

  // 2. Direct link on StudentProfile document (assignedCounselorId)
  if (
    studentProfile &&
    studentProfile.assignedCounselorId &&
    isSameId(studentProfile.assignedCounselorId, counselorId)
  ) {
    return true;
  }

  // 3. Invitation link on StudentProfile document (invitedBy)
  if (studentProfile && studentProfile.invitedBy && isSameId(studentProfile.invitedBy, counselorId)) {
    return true;
  }

  return false;
};

module.exports = {
  isSameId,
  canCounselorAccessStudent,
};

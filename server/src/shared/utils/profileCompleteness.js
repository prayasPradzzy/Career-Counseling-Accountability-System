/**
 * Dynamic Profile Completeness Calculator
 * Computes completeness percentage based ONLY on fields that exist on the user's specific role schema.
 */

function computeStudentCompleteness(profile) {
  if (!profile) return 0;

  const totalFields = 8;
  let filledFields = 0;

  // 1. Phone
  if (profile.phone && profile.phone.trim().length > 0) filledFields++;

  // 2. Gender
  if (profile.gender && profile.gender !== "prefer-not-to-say") filledFields++;

  // 3. Academic Institution
  const edu = (Array.isArray(profile.education) && profile.education[0]) || profile.academic || {};
  if (edu.institution && edu.institution.trim().length > 0) filledFields++;

  // 4. Degree Program
  if ((edu.degreeProgram || edu.degree) && (edu.degreeProgram || edu.degree).trim().length > 0) filledFields++;

  // 5. Field of Study
  if (edu.fieldOfStudy && edu.fieldOfStudy.trim().length > 0) filledFields++;

  // 6. Graduation Year
  if (edu.graduationYear || edu.endYear) filledFields++;

  // 7. Target Career Roles
  const targetRoles = profile.careerGoals?.targetRoles || (Array.isArray(profile.careerGoals) ? profile.careerGoals : []);
  if (Array.isArray(targetRoles) && targetRoles.length > 0) filledFields++;

  // 8. Key Skills
  const skills = profile.careerGoals?.keySkills || (Array.isArray(profile.skills) ? profile.skills : []);
  if (Array.isArray(skills) && skills.length > 0) filledFields++;

  return Math.round((filledFields / totalFields) * 100);
}

function computeCounselorCompleteness(profile) {
  if (!profile) return 0;

  const totalFields = 9;
  let filledFields = 0;

  // 1. Phone
  if (profile.phone && profile.phone.trim().length > 0) filledFields++;

  // 2. Gender
  if (profile.gender && profile.gender !== "prefer-not-to-say") filledFields++;

  // 3. Highest Qualification
  if (profile.credentials?.highestQualification && profile.credentials.highestQualification.trim().length > 0) filledFields++;

  // 4. Institution
  if (profile.credentials?.institution && profile.credentials.institution.trim().length > 0) filledFields++;

  // 5. Certifications
  if (Array.isArray(profile.credentials?.certifications) && profile.credentials.certifications.length > 0) filledFields++;

  // 6. Specializations
  if (Array.isArray(profile.practice?.specializations) && profile.practice.specializations.length > 0) filledFields++;

  // 7. Years of Experience
  if (typeof profile.practice?.yearsExperience === "number" && profile.practice.yearsExperience > 0) filledFields++;

  // 8. Languages Spoken
  if (Array.isArray(profile.practice?.languagesSpoken) && profile.practice.languagesSpoken.length > 0) filledFields++;

  // 9. Professional Bio
  if (profile.practice?.bio && profile.practice.bio.trim().length > 0) filledFields++;

  return Math.round((filledFields / totalFields) * 100);
}

function calculateRoleProfileCompleteness(role, profile) {
  if (role === "counselor") {
    return computeCounselorCompleteness(profile);
  }
  return computeStudentCompleteness(profile);
}

module.exports = {
  computeStudentCompleteness,
  computeCounselorCompleteness,
  calculateRoleProfileCompleteness,
};

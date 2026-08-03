/**
 * Mock Profile Data Layer
 * Standardized response shape for user profiles, education, and career preferences.
 */
export const mockProfileData = {
  completionPercentage: 85,
  basicInfo: {
    phone: "+1 (555) 234-5678",
    gender: "Prefer not to say",
    location: "New York, USA",
    dateOfBirth: "2002-05-15",
  },
  academicInfo: {
    institution: "Columbia University",
    degree: "Bachelor of Science",
    fieldOfStudy: "Computer Science",
    graduationYear: 2026,
    gpa: "3.85 / 4.0",
  },
  careerGoals: {
    targetRoles: ["Software Architect", "AI Product Manager", "Data Scientist"],
    preferredIndustries: ["Technology & SaaS", "Artificial Intelligence", "EdTech"],
    desiredSkills: ["System Architecture", "Python", "Full Stack Development", "Machine Learning"],
  },
  accountInfo: {
    memberSince: "August 2026",
    securityStatus: "Verified",
    authStrategy: "HttpOnly Cookie JWT",
  },
};

export default mockProfileData;

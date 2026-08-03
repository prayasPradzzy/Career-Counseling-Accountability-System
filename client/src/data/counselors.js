/**
 * Mock Counselors Data Layer
 * Standardized response shape for counselor directory and search filters.
 */
export const mockCounselorsData = {
  specializationOptions: [
    { value: "all", label: "All Specializations" },
    { value: "STEM", label: "STEM & Technology" },
    { value: "Business", label: "Business & Finance" },
    { value: "Design", label: "Design & Creative" },
    { value: "Data", label: "Data & Healthcare" },
  ],
  counselors: [
    {
      id: "c-1",
      name: "Dr. Sarah Jenkins",
      initials: "SJ",
      specialization: "STEM & AI Careers",
      experienceYears: 12,
      rating: 4.9,
      reviewCount: 128,
      availability: "Available Today",
      availabilityStatus: "available",
      bio: "Former Tech Hiring Lead specializing in Software Engineering, AI, and Product Management roadmaps.",
      keySkills: ["Artificial Intelligence", "Software Engineering", "Product Strategy"],
    },
    {
      id: "c-2",
      name: "Marcus Vance",
      initials: "MV",
      specialization: "Business & Finance",
      experienceYears: 8,
      rating: 4.8,
      reviewCount: 94,
      availability: "Next Available: Tomorrow",
      availabilityStatus: "available",
      bio: "Certified Career Coach helping students enter Investment Banking, Strategy Consulting, and VC.",
      keySkills: ["Finance", "Venture Capital", "Management Consulting"],
    },
    {
      id: "c-3",
      name: "Elena Rostova",
      initials: "ER",
      specialization: "Design & Creative Media",
      experienceYears: 10,
      rating: 4.95,
      reviewCount: 156,
      availability: "Busy This Week",
      availabilityStatus: "busy",
      bio: "Senior UX Mentor helping designers build world-class portfolios and land global tech roles.",
      keySkills: ["UX/UI Design", "Portfolio Review", "Design Leadership"],
    },
    {
      id: "c-4",
      name: "David Chen",
      initials: "DC",
      specialization: "Data & Healthcare",
      experienceYears: 7,
      rating: 4.75,
      reviewCount: 62,
      availability: "Available Today",
      availabilityStatus: "available",
      bio: "Biotech career consultant bridging academic research and commercial bio-health industries.",
      keySkills: ["Biotechnology", "Data Science", "Clinical Research"],
    },
  ],
};

export default mockCounselorsData;

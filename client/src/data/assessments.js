/**
 * Mock Assessments Data Layer
 * Standardized response shape for psychometric test definitions and library items.
 */
export const mockAssessmentsData = {
  assessments: [
    {
      id: "assess-1",
      code: "HOLLAND_RIASEC",
      title: "Interest & Vocational Profile",
      category: "Interests",
      iconName: "Compass",
      description: "Evaluates your career interests across Realistic, Investigative, Artistic, Social, Enterprising, and Conventional dimensions.",
      durationMinutes: 15,
      questionCount: 30,
      status: "Available",
      statusVariant: "outline",
    },
    {
      id: "assess-2",
      code: "BIG_FIVE_OCEAN",
      title: "Personality & Workplace Traits",
      category: "Personality",
      iconName: "Brain",
      description: "Measures Openness, Conscientiousness, Extraversion, Agreeableness, and Emotional Stability in professional environments.",
      durationMinutes: 20,
      questionCount: 45,
      status: "Available",
      statusVariant: "outline",
    },
    {
      id: "assess-3",
      code: "WORK_VALUES",
      title: "Work Values & Motivations",
      category: "Values",
      iconName: "Heart",
      description: "Identifies core motivators such as autonomy, financial compensation, work-life balance, innovation, and social impact.",
      durationMinutes: 12,
      questionCount: 24,
      status: "Available",
      statusVariant: "outline",
    },
    {
      id: "assess-4",
      code: "COGNITIVE_APTITUDE",
      title: "Intelligence & Cognitive Aptitude",
      category: "Intelligence",
      iconName: "Sparkles",
      description: "Tests logical reasoning, spatial visualization, numerical problem-solving, and verbal analysis skills.",
      durationMinutes: 25,
      questionCount: 35,
      status: "Coming Soon",
      statusVariant: "secondary",
    },
  ],
};

export default mockAssessmentsData;

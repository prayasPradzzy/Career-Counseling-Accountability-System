import { ROLES } from "@/constants/roles";

/**
 * Mock Dashboard Data Layer
 * Role-driven operational datasets for Student, Counselor, Parent, and Admin dashboards.
 * Reusable, API-ready data shapes.
 */
export const mockRoleDashboards = {
  // ---------------------------------------------------------------------------
  // 1. STUDENT DASHBOARD DATA
  // ---------------------------------------------------------------------------
  [ROLES.STUDENT]: {
    stats: [
      {
        id: "assessment-progress",
        label: "Assessment Progress",
        value: "2 / 3",
        note: "RIASEC & Aptitude Completed",
        iconName: "BookOpen",
        variant: "default",
      },
      {
        id: "upcoming-sessions",
        label: "Upcoming Sessions",
        value: "1 Scheduled",
        note: "Tomorrow, 2:00 PM (IST)",
        iconName: "Calendar",
        variant: "default",
      },
      {
        id: "latest-reports",
        label: "Latest Reports",
        value: "1 Published",
        note: "Comprehensive Career Report",
        iconName: "FileText",
        variant: "default",
      },
      {
        id: "recommendations",
        label: "Career Matches",
        value: "3 Recommendations",
        note: "Top: AI Systems Architect",
        iconName: "Compass",
        variant: "default",
      },
      {
        id: "profile-completion",
        label: "Profile Completion",
        value: "85%",
        note: "Guardian contact missing",
        iconName: "Target",
        variant: "default",
      },
      {
        id: "pending-tasks",
        label: "Pending Action Items",
        value: "2 Tasks",
        note: "Complete Personality Assessment",
        iconName: "ListTodo",
        variant: "default",
      },
    ],

    assessmentProgress: [
      {
        id: "ass-1",
        title: "Holland RIASEC Interest Inventory",
        category: "Interest",
        status: "completed",
        score: "Investigative-Artistic (IA)",
        completedAt: "2 days ago",
      },
      {
        id: "ass-2",
        title: "STEM Cognitive Aptitude Benchmark",
        category: "Aptitude",
        status: "completed",
        score: "92nd Percentile",
        completedAt: "Yesterday",
      },
      {
        id: "ass-3",
        title: "Big Five OCEAN Personality Profile",
        category: "Personality",
        status: "in-progress",
        score: "60% Completed",
        completedAt: "In Progress",
      },
    ],

    upcomingSessions: [
      {
        id: "sess-1",
        counselorName: "Dr. Sarah Jenkins",
        specialization: "STEM & AI Careers",
        dateTime: "Aug 5, 2:00 PM - 3:00 PM IST",
        type: "Initial Guidance Session",
        status: "confirmed",
      },
    ],

    latestReports: [
      {
        id: "rep-1",
        title: "Quarterly Comprehensive Guidance & Aptitude Analysis",
        counselor: "Dr. Sarah Jenkins",
        publishedAt: "Aug 1, 2026",
        downloadUrl: "#",
      },
    ],

    recommendations: [
      {
        id: "rec-1",
        title: "AI & Machine Learning Architect",
        matchScore: "96% Match",
        industry: "Technology",
        growthRate: "+24% Annual Growth",
      },
      {
        id: "rec-2",
        title: "UX Research & System Strategist",
        matchScore: "91% Match",
        industry: "Design & Product",
        growthRate: "+18% Annual Growth",
      },
      {
        id: "rec-3",
        title: "Biomedical Data Scientist",
        matchScore: "87% Match",
        industry: "Healthcare Tech",
        growthRate: "+15% Annual Growth",
      },
    ],

    pendingTasks: [
      {
        id: "task-1",
        title: "Complete Big Five Personality Questionnaire",
        dueDate: "Due in 2 days",
        priority: "high",
      },
      {
        id: "task-2",
        title: "Submit Signed Guardian Consent Form",
        dueDate: "Due this week",
        priority: "medium",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 2. COUNSELOR DASHBOARD DATA
  // ---------------------------------------------------------------------------
  [ROLES.COUNSELOR]: {
    stats: [
      {
        id: "assigned-students",
        label: "Assigned Students",
        value: "24 Active",
        note: "3 added this week",
        iconName: "Users",
        variant: "default",
      },
      {
        id: "awaiting-assignment",
        label: "Awaiting Assignment",
        value: "4 Pending",
        note: "Require counselor binding",
        iconName: "UserPlus",
        variant: "default",
      },
      {
        id: "assessments-review",
        label: "Pending Assessment Reviews",
        value: "5 Reviews",
        note: "Requires score analysis",
        iconName: "BookOpen",
        variant: "default",
      },
      {
        id: "interviews-today",
        label: "Interviews Today",
        value: "2 Scheduled",
        note: "Next at 2:00 PM",
        iconName: "Calendar",
        variant: "default",
      },
      {
        id: "reports-approval",
        label: "Reports Pending Approval",
        value: "2 Drafts",
        note: "Awaiting final signature",
        iconName: "FileText",
        variant: "default",
      },
      {
        id: "todays-tasks",
        label: "Counselor Action Items",
        value: "4 Tasks",
        note: "Notes & recommendations",
        iconName: "ListTodo",
        variant: "default",
      },
    ],

    interviewsToday: [
      {
        id: "int-1",
        studentName: "Alex Johnson",
        email: "alex.johnson@student.edu",
        timeSlot: "2:00 PM - 3:00 PM",
        type: "Career Roadmap Review",
        status: "confirmed",
      },
      {
        id: "int-2",
        studentName: "Priya Sharma",
        email: "priya.sharma@student.edu",
        timeSlot: "4:30 PM - 5:30 PM",
        type: "Post-Assessment debrief",
        status: "confirmed",
      },
    ],

    studentsAwaitingAssignment: [
      {
        id: "unassigned-1",
        studentName: "Rohan Patel",
        email: "rohan.patel@student.edu",
        registeredAt: "Yesterday",
        completionPercentage: 70,
      },
      {
        id: "unassigned-2",
        studentName: "Samantha Lee",
        email: "samantha.lee@student.edu",
        registeredAt: "3 days ago",
        completionPercentage: 60,
      },
    ],

    assessmentsPendingReview: [
      {
        id: "rev-1",
        studentName: "Alex Johnson",
        assessmentTitle: "Holland RIASEC Inventory",
        submittedAt: "2 hours ago",
        rawCode: "RIA",
      },
      {
        id: "rev-2",
        studentName: "Priya Sharma",
        assessmentTitle: "Cognitive Aptitude Test",
        submittedAt: "Yesterday",
        rawCode: "94th Percentile",
      },
    ],

    reportsPendingApproval: [
      {
        id: "draft-1",
        studentName: "Alex Johnson",
        reportTitle: "Annual Career & Higher Education Guidance Plan",
        lastUpdated: "Yesterday",
        status: "draft",
      },
      {
        id: "draft-2",
        studentName: "Priya Sharma",
        reportTitle: "Aptitude Analysis & University Admissions Strategy",
        lastUpdated: "2 days ago",
        status: "draft",
      },
    ],

    recentStudentActivity: [
      {
        id: "act-c1",
        studentName: "Alex Johnson",
        action: "Completed Cognitive Aptitude Benchmark assessment",
        timestamp: "10 minutes ago",
        iconName: "CheckCircle2",
      },
      {
        id: "act-c2",
        studentName: "Priya Sharma",
        action: "Updated target career goals to Data Science",
        timestamp: "1 hour ago",
        iconName: "Target",
      },
      {
        id: "act-c3",
        studentName: "Rohan Patel",
        action: "Submitted parental consent documentation",
        timestamp: "3 hours ago",
        iconName: "ShieldCheck",
      },
    ],

    todaysTasks: [
      {
        id: "ctask-1",
        title: "Review Alex Johnson's RIASEC assessment results",
        dueDate: "Today",
        priority: "high",
      },
      {
        id: "ctask-2",
        title: "Finalize and sign Priya Sharma's Career Report",
        dueDate: "Today",
        priority: "high",
      },
      {
        id: "ctask-3",
        title: "Prepare interview agenda for Rohan Patel",
        dueDate: "Tomorrow",
        priority: "medium",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 3. PARENT DASHBOARD DATA
  // ---------------------------------------------------------------------------
  [ROLES.PARENT]: {
    stats: [
      {
        id: "child-progress",
        label: "Child Progress",
        value: "Milestone 3 / 5",
        note: "Assessments Completed",
        iconName: "TrendingUp",
        variant: "default",
      },
      {
        id: "parent-reports",
        label: "Published Reports",
        value: "1 Report",
        note: "View counselor analysis",
        iconName: "FileText",
        variant: "default",
      },
      {
        id: "parent-sessions",
        label: "Counselor Sessions",
        value: "1 Upcoming",
        note: "Aug 5 with Dr. Sarah",
        iconName: "Calendar",
        variant: "default",
      },
      {
        id: "assessment-overview",
        label: "Assessment Overview",
        value: "2 Completed",
        note: "Top Aptitude: STEM",
        iconName: "Award",
        variant: "default",
      },
    ],

    childMilestones: [
      {
        id: "ms-1",
        title: "Account Registration & Profile Setup",
        timestamp: "Completed",
        status: "completed",
        description: "Child's profile and academic history configured.",
      },
      {
        id: "ms-2",
        title: "Psychometric Assessment Suite",
        timestamp: "Completed",
        status: "completed",
        description: "Holland RIASEC and Cognitive Aptitude tests taken.",
      },
      {
        id: "ms-3",
        title: "Counselor Initial Guidance Session",
        timestamp: "Aug 5, 2:00 PM",
        status: "pending",
        description: "Scheduled consultation with certified counselor.",
      },
      {
        id: "ms-4",
        title: "Comprehensive Career Roadmap Report",
        timestamp: "Pending Session",
        status: "draft",
        description: "Counselor published recommendations & target pathways.",
      },
    ],

    latestReports: [
      {
        id: "prep-1",
        title: "Child Career Guidance & Aptitude Report",
        counselor: "Dr. Sarah Jenkins",
        publishedAt: "Aug 1, 2026",
        summary: "High investigative & logical reasoning scores; recommended STEM/AI tracks.",
      },
    ],

    upcomingSessions: [
      {
        id: "psess-1",
        counselorName: "Dr. Sarah Jenkins",
        dateTime: "Aug 5, 2:00 PM IST",
        type: "Parent-Counselor Guidance Debrief",
        status: "confirmed",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 4. ADMINISTRATOR DASHBOARD DATA
  // ---------------------------------------------------------------------------
  [ROLES.ADMIN]: {
    stats: [
      {
        id: "total-students",
        label: "Total Students",
        value: "142 Students",
        note: "+18 this month",
        iconName: "GraduationCap",
        variant: "default",
      },
      {
        id: "total-counselors",
        label: "Total Counselors",
        value: "18 Verified",
        note: "100% SLA compliance",
        iconName: "UserCheck",
        variant: "default",
      },
      {
        id: "pending-verification",
        label: "Counselor Verifications",
        value: "2 Pending",
        note: "Requires credential review",
        iconName: "AlertCircle",
        variant: "default",
      },
      {
        id: "assessment-stats",
        label: "Assessment Test Runs",
        value: "412 Runs",
        note: "Avg 3.2 runs / student",
        iconName: "BookOpen",
        variant: "default",
      },
      {
        id: "career-database",
        label: "Career DB References",
        value: "924 Titles",
        note: "O*NET 2026 Taxonomy",
        iconName: "Database",
        variant: "default",
      },
      {
        id: "platform-health",
        label: "Platform Health",
        value: "99.95% Uptime",
        note: "API p95: 140ms",
        iconName: "Activity",
        variant: "default",
      },
    ],

    counselorVerificationQueue: [
      {
        id: "ver-1",
        name: "Dr. Robert Vance",
        email: "robert.vance@counselor.org",
        specialization: "Engineering & Applied Sciences",
        submittedAt: "Yesterday",
        credentialsUrl: "#",
      },
      {
        id: "ver-2",
        name: "Maria Garcia",
        email: "maria.garcia@counselor.org",
        specialization: "Creative Arts & Design",
        submittedAt: "2 days ago",
        credentialsUrl: "#",
      },
    ],

    assessmentStatistics: [
      { id: "ast-1", category: "Interest (Holland RIASEC)", totalRuns: 184, avgDuration: "15 mins" },
      { id: "ast-2", category: "Cognitive Aptitude", totalRuns: 142, avgDuration: "25 mins" },
      { id: "ast-3", category: "Big Five OCEAN Personality", totalRuns: 86, avgDuration: "12 mins" },
    ],

    careerDatabaseSummary: {
      taxonomyVersion: "O*NET 2026.1",
      totalCareers: 924,
      totalIndustries: 16,
      topRequestedIndustry: "Technology & Software Engineering",
      salaryUpdateDate: "Aug 2026",
    },

    platformHealth: {
      status: "Operational",
      uptimePercentage: "99.95%",
      apiLatencyP95: "140ms",
      databaseConnections: "Active (Atlas Cluster)",
      activeSessions: 38,
    },
  },
};

export default mockRoleDashboards;

# Career Counseling Platform — Project Memory & Architecture Log

## Project Status

- **Phase**: Complete Counseling Pipeline Architecture (Completed & Verified)
- **Current Architecture Status**:
  - **Backend**: Node.js, Express, MongoDB Atlas, Mongoose, JWT (HttpOnly Cookie), bcrypt.
  - **Frontend**: Next.js App Router (JavaScript), TailwindCSS, Base UI primitives, Lucide Icons, Axios singleton (`api.js`), TanStack React Query (`@tanstack/react-query`), Sonner toast notifications, `react-hook-form` + `zod`.
  - **Complete Counseling Pipeline Architecture**:
    - **End-to-End Pipeline**:
      `Student` ➔ `CounselingSession` (Parent Entity) ➔ `Interview` ➔ `OCR` ➔ `Speech Transcript` ➔ `AI Summary` ➔ `Interview Insights` ➔ `Assessment Results` ➔ `Recommendation` ➔ `Report` ➔ `Student Views Report`
    - **Parent Session Model (`server/src/modules/sessions/counselingSession.model.js`)**: Single source of truth parent entity. Statuses: `SCHEDULED`, `CONFIRMED`, `COMPLETED`, `CANCELLED`, `NO_SHOW`. Stores counselorNotes, clientGoalsStated, meetingLink, attachments array, interview log, and architecture placeholders for future OCR, Audio, Transcript, and AI Summary.
    - **Recommendations Architecture (`server/src/modules/recommendations/recommendation.model.js`)**: Enforced rule that Recommendations belong directly to `Report` via `reportId` (not directly to Student).
    - **Immutable Report & Versioning Architecture (`server/src/modules/reports/report.model.js`)**: Report model upgraded to store:
      - Assessment Results (`includedAssessmentScoreIds`)
      - Interview Insights (`includedInterviewInsightIds`)
      - Recommendations (`includedRecommendationIds`)
      - Career Matches (`careerMatches`)
      - Action Plan (`actionPlan`: shortTermGoals, longTermGoals, milestones)
      - Immutability Controls (`isFinalized`, `finalizedAt`)
      - Versioning Architecture (`version`, `parentReportId`)
      - Edit History Tracking (`editHistory`: editedBy, editedAt, changeSummary, previousStateSnapshot)
    - **ERD Architecture Document (`docs/ERD.md`)**: Updated and verified all relationships and entity classifications.
  - **Generic Counselor-Driven Assessment Assignment Workflow**:
    - **Guard Rule Enforced**: Students can NEVER freely start assessments without an active, unlocked assignment created by a counselor or administrator.
    - **5 Generic Assessment Categories Supported**: `personality`, `interest`, `values`, `intelligence`, `aptitude`.
    - **Assignment Lifecycle Enums (`ASSIGNMENT_STATUS`)**: `ASSIGNED` ➔ `SCHEDULED` ➔ `IN_PROGRESS` ➔ `COMPLETED` ➔ `UNDER_REVIEW` ➔ `APPROVED` / `REJECTED` / `EXPIRED`.
    - **Backend Model (`server/src/modules/assessments/assessmentAssignment.model.js`)**: Generic model tracking studentId, counselorId, assessmentDefinitionId, category, status, scheduledFor, dueDate, assignedAt, startedAt, completedAt, reviewedAt, approvedAt, counselorNotes, unlocksNextAssessmentId, prerequisiteAssignmentId.
    - **Backend Service (`server/src/modules/assessments/assessmentAssignment.service.js`)**: Encapsulates assign, list, start, complete, review, approve, auto-unlock, and prerequisite check logic without hardcoded scoring or question logic.
    - **API Router (`server/src/modules/assessments/assessmentAssignment.routes.js`)**: Mounted under `/api/v1/assessments` with RBAC authorization (`counselor`, `admin`, `student`).
    - **Frontend API Service & React Query Hooks (`assessmentAssignmentService.js`, `useAssessmentAssignments.js`)**: Generic data access layer supporting `useStudentAssignments`, `useMyAssignments`, `useAssignAssessment`, `useStartAssignment`, `useCompleteAssignment`, `useReviewAssignment`, `useApproveAssignment`.
    - **UI Component (`AssessmentHistorySection.jsx`)**: Renders generic assessment assignments across all 5 categories with status badges, due dates, review states, counselor approval badges, and locked/unlocked indicators.
  - **Centralized Student Lifecycle Status System**:
    - **12-Stage Flow Enums (`STUDENT_STATUS`)**:
      `REGISTERED` ➔ `PROFILE_INCOMPLETE` ➔ `PROFILE_COMPLETE` ➔ `COUNSELOR_ASSIGNED` ➔ `ASSESSMENT_PENDING` ➔ `ASSESSMENT_IN_PROGRESS` ➔ `ASSESSMENT_COMPLETED` ➔ `INTERVIEW_PENDING` ➔ `INTERVIEW_COMPLETED` ➔ `REPORT_DRAFT` ➔ `REPORT_PUBLISHED` ➔ `CAREER_PLAN_COMPLETED`
    - **Backend Integration (`server/src/shared/constants/studentStatus.constants.js`)**: Reusable constants, status label mappings, progression array, and `deriveStudentLifecycleStatus(profile)` engine.
    - **Schema Extension (`server/src/modules/profiles/clientProfile.model.js`)**: Model enum expanded to include all 12 lifecycle statuses plus legacy values (`active`, `invited`, `archived`) without breaking existing database documents.
    - **Automatic Progression (`server/src/modules/clients/client.service.js`)**: Service automatically evaluates profile completion percentage, counselor assignment, test runs, interview sessions, and report publishing to transition lifecycle status seamlessly across all CRUD operations.
    - **Frontend Constants (`client/src/constants/studentStatus.constants.js`)**: Reusable `STUDENT_STATUS`, `STUDENT_STATUS_LABELS`, `STUDENT_STATUS_CONFIGS`, and `STUDENT_STATUS_FILTER_OPTIONS` exported for UI components.
    - **UI Status Badges & Filtering (`StatusBadge.jsx`, `StudentTable.jsx`, `StudentsPage`)**: Direct integration into student directory table and dynamic status filter dropdown.
    - **Longitudinal Timeline (`ProgressTimelineSection.jsx`)**: Dynamically renders 12-stage milestone progression timeline based on current student lifecycle status.
  - **Operational Dashboard Framework**:
    - **Data Layer (`src/data/dashboard.js`)**: Structured operational datasets for `student`, `counselor`, `parent`, and `admin` roles without hardcoding inside React components.
    - **Role Views (`src/features/dashboard/components/`)**: `StudentDashboardView`, `CounselorDashboardView`, `ParentDashboardView`, `AdminDashboardView`.
    - **Dynamic Dashboard Router (`src/app/(dashboard)/dashboard/page.js`)**: Dynamically renders the target operational view based on `user.role` from `useAuth()`.
  - **Student Profile Central Hub (`StudentProfileHub`)**:
    - **Hub Component (`src/features/students/components/StudentProfileHub.jsx`)**: Central tabbed container using Radix UI Tabs. All 11 tabs: Overview, Personal Info, Education, Guardian, Counselor, Assessments & Scores, Interviews & Notes, AI Insights, Recommendations, Reports, Timeline.

## Verification & Build Log

- **Next.js Production Build**: Executed `npm run build` in `client/`.
- **Result**: Successfully compiled 19 routes with **0 errors**, 0 TypeScript errors, and 0 hydration warnings.

## Next Phase

- Ready for user review.

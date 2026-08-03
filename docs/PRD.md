# Product Requirements Document (PRD)

## Career Counseling Platform

| Field              | Value                                      |
| ------------------ | ------------------------------------------ |
| **Document Owner** | Product & Engineering                      |
| **Version**        | 1.0.0                                      |
| **Status**         | Draft                                      |
| **Created**        | 2026-08-01                                 |
| **Last Updated**   | 2026-08-01                                 |
| **Classification** | Internal — Confidential                    |

---

## Table of Contents

- [1. Executive Summary](#1-executive-summary)
- [2. Problem Statement](#2-problem-statement)
- [3. Vision & Objectives](#3-vision--objectives)
- [4. Target Users](#4-target-users)
- [5. User Personas](#5-user-personas)
- [6. Core User Stories](#6-core-user-stories)
- [7. Feature Requirements](#7-feature-requirements)
- [8. Non-Functional Requirements](#8-non-functional-requirements)
- [9. Out of Scope](#9-out-of-scope)
- [10. Success Metrics](#10-success-metrics)
- [11. Assumptions & Dependencies](#11-assumptions--dependencies)
- [12. Risks & Mitigations](#12-risks--mitigations)
- [13. Release Strategy](#13-release-strategy)
- [14. Glossary](#14-glossary)
- [15. Revision History](#15-revision-history)

---

## 1. Executive Summary

The **Career Counseling Platform** is a web-based SaaS application designed to connect students and job-seekers with professional career counselors. The platform streamlines the entire counseling lifecycle — from discovery and booking to session management, AI-powered career assessments, report generation, and personalized career recommendations.

The platform addresses a critical gap in the career guidance market: the lack of a unified, technology-driven solution that combines human expertise with AI capabilities to deliver personalized, data-driven career advice at scale.

### Product Vision Statement

> Empower every individual to make informed career decisions through accessible, personalized, and AI-enhanced career counseling — anytime, anywhere.

---

## 2. Problem Statement

### The Problem

Career counseling today is fragmented, inaccessible, and largely analog:

1. **Accessibility Barrier**: Quality career counseling is expensive ($100–$300/session) and geographically limited. Students in tier-2/tier-3 cities and rural areas have little to no access to qualified counselors.

2. **Fragmented Experience**: Students juggle multiple tools — spreadsheets for tracking interests, email for booking, WhatsApp for communication, PDFs for reports. There is no single platform that owns the end-to-end counseling journey.

3. **Lack of Data-Driven Guidance**: Most counselors rely on subjective assessments. There is no systematic way to combine psychometric data, academic records, market trends, and personal aptitudes into actionable recommendations.

4. **Scalability of Counselors**: A single counselor can handle 6–8 sessions per day. Without technology, scaling personalized counseling to thousands of students is impossible.

5. **No Continuity**: Counseling relationships often lack continuity. Session notes are lost, follow-ups are missed, and there is no longitudinal tracking of a student's career development.

### Who Experiences This Problem

- **Students** (high school and college) making critical career decisions with insufficient guidance
- **Job-seekers** transitioning careers without structured support
- **Career counselors** who lack efficient tools to manage clients, sessions, and follow-ups
- **Educational institutions** that want to offer career services but lack the infrastructure

### Impact of Not Solving It

- Students make uninformed career choices, leading to high dropout rates and career dissatisfaction
- Counselors burn out managing administrative overhead instead of focusing on counseling
- Institutions cannot scale career services beyond a handful of students

---

## 3. Vision & Objectives

### Product Vision (3-Year Horizon)

Build the **leading career counseling platform** that combines human expertise with AI to deliver personalized, affordable, and scalable career guidance. The platform will serve as the operating system for career development — from self-discovery to job placement.

### Strategic Objectives

| # | Objective                                  | Key Result                                                    | Timeline   |
|---|--------------------------------------------|---------------------------------------------------------------|------------|
| 1 | Launch MVP with core counseling workflow   | Auth, profiles, session booking, basic dashboard              | Phase 1–3  |
| 2 | Enable AI-powered career assessments       | Integrated psychometric assessments with AI analysis          | Phase 4–5  |
| 3 | Deliver personalized career recommendations | Recommendation engine based on user data + market trends     | Phase 5–6  |
| 4 | Generate professional career reports       | Automated PDF/document report generation post-assessment      | Phase 5    |
| 5 | Scale to multi-tenant SaaS                 | Institutions can white-label the platform                     | Phase 7+   |

---

## 4. Target Users

### Primary Users

| User Type       | Description                                                                 | Priority |
|-----------------|-----------------------------------------------------------------------------|----------|
| **Student**     | High school or college student seeking career guidance and assessments       | P0       |
| **Counselor**   | Professional career counselor managing multiple students                    | P0       |
| **Admin**       | Platform administrator managing users, counselors, and platform settings    | P0       |

### Secondary Users (Future)

| User Type              | Description                                                         | Priority |
|------------------------|---------------------------------------------------------------------|----------|
| **Institution Admin**  | School/college admin managing their institution's counseling program | P1       |
| **Parent/Guardian**    | Parent tracking their child's career development journey            | P2       |
| **Employer/Recruiter** | Organizations looking to connect with career-ready candidates       | P3       |

---

## 5. User Personas

### Persona 1: Arjun — The Confused Student

| Attribute      | Detail                                                                     |
|----------------|----------------------------------------------------------------------------|
| **Age**        | 17, Class 12 student                                                       |
| **Location**   | Pune, India                                                                |
| **Goal**       | Understand which career path suits his interests and aptitudes             |
| **Pain Point** | Overwhelmed by options; parents want engineering, he's interested in design |
| **Behavior**   | Researches online, watches YouTube, but wants personalized guidance         |
| **Success**    | A clear, data-backed career roadmap with actionable next steps             |

### Persona 2: Priya — The Career Counselor

| Attribute      | Detail                                                                     |
|----------------|----------------------------------------------------------------------------|
| **Age**        | 34, certified career counselor                                             |
| **Location**   | Mumbai, India                                                              |
| **Goal**       | Manage 50+ students efficiently with proper tracking and reporting          |
| **Pain Point** | Spends 40% of time on admin tasks (scheduling, notes, follow-ups)          |
| **Behavior**   | Uses Google Sheets + WhatsApp; wants a professional tool                   |
| **Success**    | A single dashboard to manage all students, sessions, and reports           |

### Persona 3: Admin — The Platform Operator

| Attribute      | Detail                                                                     |
|----------------|----------------------------------------------------------------------------|
| **Age**        | 28, operations manager                                                     |
| **Location**   | Remote                                                                     |
| **Goal**       | Ensure platform quality, manage counselors, and monitor growth             |
| **Pain Point** | No visibility into counselor performance or student satisfaction           |
| **Behavior**   | Data-driven; wants dashboards and analytics                                |
| **Success**    | Real-time metrics on platform usage, counselor ratings, and revenue        |

---

## 6. Core User Stories

### Authentication & Profile

| ID     | As a...    | I want to...                           | So that...                                          | Priority |
|--------|------------|----------------------------------------|-----------------------------------------------------|----------|
| US-001 | Student    | Register with email and password       | I can create my account and access the platform     | P0       |
| US-002 | User       | Log in securely                        | I can access my personalized dashboard              | P0       |
| US-003 | User       | Log out from any device                | My session is terminated securely                   | P0       |
| US-004 | User       | View and edit my profile               | My information is accurate and up-to-date           | P0       |
| US-005 | User       | Reset my forgotten password            | I can regain access to my account                   | P1       |
| US-006 | Admin      | Manage user roles and permissions      | The right people have the right access              | P0       |

### Counselor Management

| ID     | As a...    | I want to...                           | So that...                                          | Priority |
|--------|------------|----------------------------------------|-----------------------------------------------------|----------|
| US-010 | Admin      | Add and verify counselors              | Only qualified counselors are on the platform       | P0       |
| US-011 | Student    | Browse counselor profiles              | I can choose a counselor that fits my needs         | P0       |
| US-012 | Counselor  | Set my availability schedule           | Students can book sessions during my free slots     | P0       |
| US-013 | Counselor  | View my upcoming sessions              | I can prepare for each student's session            | P0       |

### Session Management

| ID     | As a...    | I want to...                           | So that...                                          | Priority |
|--------|------------|----------------------------------------|-----------------------------------------------------|----------|
| US-020 | Student    | Book a session with a counselor        | I can receive personalized career guidance          | P0       |
| US-021 | Counselor  | Accept or decline session requests     | I have control over my schedule                     | P0       |
| US-022 | Counselor  | Write session notes                    | I can track the student's progress over time        | P1       |
| US-023 | User       | Receive session reminders              | I don't miss scheduled sessions                     | P1       |

### Career Assessment (AI-Enhanced — Future)

| ID     | As a...    | I want to...                           | So that...                                          | Priority |
|--------|------------|----------------------------------------|-----------------------------------------------------|----------|
| US-030 | Student    | Take a career aptitude assessment      | I can discover my strengths and career matches      | P1       |
| US-031 | Counselor  | View a student's assessment results    | I can provide more targeted advice                  | P1       |
| US-032 | Student    | Receive AI-powered career suggestions  | I get data-driven career path recommendations       | P2       |

### Reports & Analytics

| ID     | As a...    | I want to...                           | So that...                                          | Priority |
|--------|------------|----------------------------------------|-----------------------------------------------------|----------|
| US-040 | Counselor  | Generate a session report              | The student has a documented summary of our session | P1       |
| US-041 | Student    | Download my career assessment report   | I have a professional document for reference        | P1       |
| US-042 | Admin      | View platform analytics dashboard      | I can monitor growth, engagement, and quality       | P2       |

---

## 7. Feature Requirements

### Phase 1 — Foundation (MVP Core)

| Feature                    | Description                                                   | Priority |
|----------------------------|---------------------------------------------------------------|----------|
| User Authentication        | Register, login, logout with JWT (HttpOnly cookies)           | P0       |
| Role-Based Access          | Student, counselor, admin roles with permission guards        | P0       |
| User Profile Management    | View and edit profile information                             | P0       |
| Responsive UI              | Mobile-first design using Next.js + Tailwind + shadcn/ui      | P0       |
| API Foundation             | RESTful API with versioning, error handling, validation       | P0       |

### Phase 2 — Counselor & Session System

| Feature                    | Description                                                   | Priority |
|----------------------------|---------------------------------------------------------------|----------|
| Counselor Profiles         | Detailed counselor profiles with specialization and bio       | P0       |
| Availability Management    | Counselors set weekly availability slots                      | P0       |
| Session Booking            | Students book available slots with counselors                 | P0       |
| Session Dashboard          | View upcoming, past, and cancelled sessions                   | P0       |
| Session Notes              | Counselors add notes after each session                       | P1       |

### Phase 3 — Communication & Notifications

| Feature                    | Description                                                   | Priority |
|----------------------------|---------------------------------------------------------------|----------|
| In-App Notifications       | Real-time notifications for bookings, reminders, updates      | P1       |
| Email Notifications        | Transactional emails for booking confirmations, reminders     | P1       |
| Session Reminders          | Automated reminders 24h and 1h before sessions               | P1       |

### Phase 4 — Assessments & AI

| Feature                    | Description                                                   | Priority |
|----------------------------|---------------------------------------------------------------|----------|
| Career Assessments         | Structured questionnaires for aptitude, interest, personality | P1       |
| AI Analysis                | AI-powered interpretation of assessment results               | P2       |
| OCR Integration            | Upload and parse academic transcripts/certificates            | P2       |
| Speech-to-Text             | Convert counseling session recordings to text notes           | P2       |

### Phase 5 — Reports & Recommendations

| Feature                    | Description                                                   | Priority |
|----------------------------|---------------------------------------------------------------|----------|
| Report Generator           | Auto-generate professional career counseling reports (PDF)    | P1       |
| Recommendation Engine      | AI-powered career path suggestions based on aggregated data   | P2       |
| Career Roadmap             | Visual career development plan with milestones                | P2       |

### Phase 6 — Analytics & Growth

| Feature                    | Description                                                   | Priority |
|----------------------------|---------------------------------------------------------------|----------|
| Admin Dashboard            | Platform-wide metrics, user growth, session analytics         | P1       |
| Counselor Analytics        | Performance metrics, ratings, session completion rates        | P1       |
| Student Progress Tracking  | Longitudinal tracking of career development journey           | P2       |

### Phase 7+ — Scale & Monetization

| Feature                    | Description                                                   | Priority |
|----------------------------|---------------------------------------------------------------|----------|
| Multi-Tenancy              | Institutions get their own branded instance                   | P2       |
| Payment Integration        | Paid sessions, subscription plans                             | P2       |
| Video Counseling           | Integrated video calls for remote sessions                    | P2       |
| Mobile App                 | React Native or Flutter mobile application                    | P3       |

---

## 8. Non-Functional Requirements

### Performance

| Metric                | Target                                           |
|-----------------------|--------------------------------------------------|
| Page Load (LCP)       | < 2.5 seconds on 3G                              |
| API Response (p95)    | < 500ms for read operations                      |
| API Response (p95)    | < 1000ms for write operations                    |
| Concurrent Users      | Support 500 concurrent users at launch            |
| Database Queries      | < 100ms for indexed queries                      |

### Security

| Requirement                  | Implementation                                    |
|------------------------------|---------------------------------------------------|
| Authentication               | JWT with HttpOnly, Secure, SameSite cookies       |
| Password Storage             | bcrypt with 12 salt rounds                        |
| Input Validation             | Server-side Zod validation on all endpoints       |
| Rate Limiting                | Per-IP and per-user rate limits on auth endpoints  |
| CORS                         | Whitelist only the client domain                  |
| Data Encryption              | TLS 1.3 in transit; AES-256 at rest (MongoDB Atlas) |
| OWASP Top 10                 | Address all applicable vulnerabilities            |
| Secrets Management           | Environment variables only; never in code         |

### Reliability

| Metric                | Target                                           |
|-----------------------|--------------------------------------------------|
| Uptime                | 99.5% (allows ~3.65 hours downtime/month)        |
| Data Backup           | Daily automated backups (MongoDB Atlas)           |
| Error Rate            | < 1% of all API requests                         |
| Graceful Degradation  | AI features degrade gracefully if service is down |

### Scalability

| Dimension             | Strategy                                          |
|-----------------------|---------------------------------------------------|
| Horizontal Scaling    | Stateless API servers behind a load balancer      |
| Database Scaling      | MongoDB Atlas auto-scaling with read replicas     |
| Caching               | Redis for session data and frequently read data   |
| CDN                   | Static assets served via CDN (Vercel/Cloudflare)  |

### Accessibility

| Requirement                  | Standard                                          |
|------------------------------|---------------------------------------------------|
| WCAG Compliance              | WCAG 2.1 Level AA                                 |
| Keyboard Navigation          | Full keyboard accessibility                       |
| Screen Reader Support        | Semantic HTML + ARIA labels                       |
| Color Contrast               | Minimum 4.5:1 contrast ratio                     |

---

## 9. Out of Scope

The following are explicitly **NOT** in scope for the initial product:

| Item                         | Reason                                            |
|------------------------------|---------------------------------------------------|
| Mobile native app            | Web-first; mobile via responsive design initially |
| Video calling integration    | Deferred to Phase 7+; use external tools initially|
| Payment processing           | Deferred to monetization phase                    |
| Multi-language support (i18n)| English-first; localization in later phases       |
| White-label/multi-tenant     | Deferred to enterprise phase                      |
| Social login (Google/OAuth)  | Deferred; email/password first for simplicity     |
| Real-time chat               | Deferred to Phase 3+                              |

---

## 10. Success Metrics

### North Star Metric

**Sessions Completed Per Month** — The single metric that best represents value delivery to both students and counselors.

### Supporting Metrics

| Category        | Metric                                | Target (Month 3) | Target (Month 6) |
|-----------------|---------------------------------------|:-----------------:|:-----------------:|
| **Acquisition** | Registered Users                      | 200               | 1,000             |
| **Acquisition** | Registered Counselors                 | 10                | 50                |
| **Activation**  | Users who complete profile            | 60%               | 75%               |
| **Engagement**  | Sessions booked per student/month     | 1.5               | 2.0               |
| **Retention**   | Monthly active users (MAU)            | 40%               | 55%               |
| **Quality**     | Session completion rate               | 85%               | 90%               |
| **Quality**     | Student satisfaction (post-session)   | 4.0/5.0           | 4.3/5.0           |
| **Technical**   | API uptime                            | 99.0%             | 99.5%             |
| **Technical**   | Average API response time             | < 500ms           | < 300ms           |

---

## 11. Assumptions & Dependencies

### Assumptions

1. Users have access to a modern web browser (Chrome, Firefox, Safari, Edge — last 2 versions)
2. Users have a stable internet connection (minimum 3G for mobile)
3. Career counselors are verified externally before being granted counselor access
4. MongoDB Atlas free/shared tier is sufficient for MVP traffic
5. The platform initially operates in a single timezone (IST) with future multi-timezone support

### Dependencies

| Dependency            | Type        | Risk Level | Mitigation                                |
|-----------------------|-------------|:----------:|-------------------------------------------|
| MongoDB Atlas         | External    | Low        | Managed service with 99.995% SLA          |
| Vercel (Hosting)      | External    | Low        | Alternative: AWS/Railway for deployment    |
| Node.js Runtime       | Technical   | Low        | LTS version; well-supported ecosystem     |
| shadcn/ui             | Library     | Low        | Components are copied, not imported        |
| OpenAI/Gemini API     | External    | Medium     | Graceful degradation; optional feature     |

---

## 12. Risks & Mitigations

| # | Risk                                        | Probability | Impact | Mitigation                                                  |
|---|---------------------------------------------|:-----------:|:------:|-------------------------------------------------------------|
| 1 | Low initial counselor supply                | High        | High   | Seed platform with partner counselors; offer free tier      |
| 2 | AI features deliver inaccurate suggestions  | Medium      | High   | Human-in-the-loop review; confidence scores; disclaimers    |
| 3 | Data privacy compliance (GDPR/DPDP Act)     | Medium      | High   | Privacy-by-design; consent management; data deletion APIs   |
| 4 | Scalability bottleneck under growth          | Low         | Medium | Stateless architecture; horizontal scaling; caching layer   |
| 5 | Counselor onboarding friction               | Medium      | Medium | Guided onboarding flow; dedicated support; documentation    |
| 6 | Feature creep delaying MVP launch            | High        | Medium | Strict phased delivery; PRD-enforced scope boundaries       |

---

## 13. Release Strategy

### MVP Definition (Phase 1–2)

The Minimum Viable Product includes:

- User authentication (register, login, logout)
- Role-based dashboards (student, counselor, admin)
- User profile management
- Counselor profile browsing
- Session booking system
- Basic session management (upcoming, past, notes)

### Release Cadence

| Release Type   | Frequency     | Description                                    |
|----------------|---------------|------------------------------------------------|
| **Major**      | Per phase      | New feature set; corresponds to PRD phases    |
| **Minor**      | Bi-weekly     | Bug fixes, UX improvements, small features     |
| **Hotfix**     | As needed     | Critical security or stability fixes           |

### Environments

| Environment    | Purpose                  | URL Pattern              |
|----------------|--------------------------|--------------------------|
| **Development**| Local development        | `localhost:3000/5000`    |
| **Staging**    | Pre-production testing   | `staging.platform.com`   |
| **Production** | Live user-facing         | `app.platform.com`       |

---

## 14. Glossary

| Term              | Definition                                                                    |
|-------------------|-------------------------------------------------------------------------------|
| **Student**       | Primary end-user seeking career guidance; registered with `student` role       |
| **Counselor**     | Verified career counseling professional; registered with `counselor` role      |
| **Admin**         | Platform operator with full access to manage users and settings               |
| **Session**       | A scheduled career counseling interaction between a student and a counselor   |
| **Assessment**    | A structured questionnaire measuring aptitude, interest, or personality       |
| **Career Roadmap**| A personalized, milestone-based plan for a student's career development       |
| **SaaS**         | Software as a Service; cloud-hosted, subscription-based software delivery     |
| **JWT**          | JSON Web Token; used for stateless authentication                             |
| **RBAC**         | Role-Based Access Control; permissions determined by user role                 |

---

## 15. Revision History

| Version | Date       | Author               | Changes                        |
|---------|------------|-----------------------|--------------------------------|
| 1.0.0   | 2026-08-01 | Product & Engineering | Initial PRD creation           |

---

> **Document Status**: This PRD is a living document. All changes must be reviewed and approved before implementation begins. Feature additions or scope changes require a PRD amendment with version increment.

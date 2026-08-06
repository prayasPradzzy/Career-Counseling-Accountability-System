import { SectionCard } from "@/components/common/SectionCard";
import { TimelineCard } from "@/components/common/TimelineCard";
import { STUDENT_STATUS_FLOW, STUDENT_STATUS_LABELS, deriveStudentLifecycleStatus } from "@/constants/studentStatus.constants";
import { TrendingUp } from "lucide-react";

export function ProgressTimelineSection({ profile, milestones = [] }) {
  const currentStatus = profile?.lifecycleStatus || deriveStudentLifecycleStatus(profile);

  const currentIndex = STUDENT_STATUS_FLOW.indexOf(currentStatus);
  const activeIndex = currentIndex >= 0 ? currentIndex : 0;

  // Generate dynamic lifecycle progression steps based on status flow
  const lifecycleMilestones = STUDENT_STATUS_FLOW.map((statusKey, idx) => {
    let statusState = "draft"; // future/upcoming
    if (idx < activeIndex) {
      statusState = "completed";
    } else if (idx === activeIndex) {
      statusState = "in-progress";
    }

    return {
      id: statusKey,
      title: STUDENT_STATUS_LABELS[statusKey],
      timestamp: statusState === "completed" ? "Completed" : statusState === "in-progress" ? "Current Phase" : "Upcoming",
      status: statusKey,
      description: getStepDescription(statusKey),
      isCurrent: idx === activeIndex,
    };
  });

  const displayList = milestones.length > 0 ? milestones : lifecycleMilestones;

  return (
    <div className="space-y-6">
      <SectionCard
        title="Longitudinal Career Progression Timeline"
        subtitle="Step-by-step milestone progression across the 12-stage student lifecycle"
        iconName="TrendingUp"
      >
        <div className="pt-2">
          {displayList.map((item, idx) => (
            <TimelineCard
              key={item._id || item.id || idx}
              title={item.title}
              timestamp={item.timestamp}
              status={item.status}
              description={item.description}
              iconName={item.status === currentStatus ? "Sparkles" : "Clock"}
            />
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function getStepDescription(statusKey) {
  switch (statusKey) {
    case "REGISTERED":
      return "Student account created and initial registration record created.";
    case "PROFILE_INCOMPLETE":
      return "Student or counselor configuring basic demographics, contact, and education info.";
    case "PROFILE_COMPLETE":
      return "Student profile metrics reached complete threshold. Ready for counselor assignment.";
    case "COUNSELOR_ASSIGNED":
      return "Primary guidance counselor assigned to manage career roadmap.";
    case "ASSESSMENT_PENDING":
      return "Psychometric assessment suite assigned to student.";
    case "ASSESSMENT_IN_PROGRESS":
      return "Student actively completing Holland RIASEC and Cognitive Aptitude assessments.";
    case "ASSESSMENT_COMPLETED":
      return "Assessments finished. Psychometric scores and dimension benchmarks computed.";
    case "INTERVIEW_PENDING":
      return "One-on-one counseling interview consultation scheduled.";
    case "INTERVIEW_COMPLETED":
      return "Consultation session conducted and counselor observation notes documented.";
    case "REPORT_DRAFT":
      return "Counselor preparing draft career recommendation report.";
    case "REPORT_PUBLISHED":
      return "Official Career Guidance & Recommendation Report published to student.";
    case "CAREER_PLAN_COMPLETED":
      return "Career roadmap execution complete with ongoing milestone tracking.";
    default:
      return "Career counseling workflow stage.";
  }
}

export default ProgressTimelineSection;

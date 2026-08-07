import { ProgressCard } from "@/components/common/ProgressCard";

/**
 * ProfileCompletion Component
 * Renders visual percentage progress bar for student profile completeness.
 */
export function ProfileCompletion({ percentage = 0, className }) {
  return (
    <ProgressCard
      title="Intake Progress"
      subtitle="Evaluates demographics, academic history, career goals, skills, and consent status"
      percentage={percentage}
      iconName="Target"
      note={percentage >= 80 ? "High Completion" : "Action Required"}
      className={className}
    />
  );
}

export default ProfileCompletion;

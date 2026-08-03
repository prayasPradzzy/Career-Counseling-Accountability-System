import { Card, CardContent } from "@/components/ui/card";
import { ProgressCard } from "@/components/common/ProgressCard";

/**
 * ProfileCompletion Component
 * Renders visual percentage progress bar for client profile completeness.
 */
export function ProfileCompletion({ percentage = 0, className }) {
  return (
    <ProgressCard
      title="Profile Completeness"
      subtitle="Evaluates demographics, education, goals, skills, and consent status"
      percentage={percentage}
      iconName="Target"
      note={percentage >= 80 ? "High Completion" : "Action Required"}
      className={className}
    />
  );
}

export default ProfileCompletion;

"use client";

import { Button } from "@/components/ui/button";
import { EmptyIllustration } from "@/components/common/EmptyIllustration";

/**
 * EngagementStarter — shown when the student has no active interview
 * engagement. Starts the interview workflow for this student.
 */
export function EngagementStarter({ onStart, isStarting }) {
  return (
    <EmptyIllustration
      iconName="MessageSquare"
      title="No Interview Engagement"
      description="Start an interview engagement to generate a cluster-organized interview guide grounded in this student's completed assessment scores."
      actionLabel={isStarting ? "Starting…" : "Start Interview Process"}
      onAction={isStarting ? undefined : onStart}
    />
  );
}

export default EngagementStarter;

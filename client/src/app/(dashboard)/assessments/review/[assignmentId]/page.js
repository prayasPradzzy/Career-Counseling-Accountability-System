"use client";

import { use } from "react";
import { CounselorAssessmentReviewDetail } from "@/features/assessments";

export default function AssessmentReviewDetailPage({ params }) {
  const resolvedParams = use(params);
  const assignmentId = resolvedParams.assignmentId;

  return <CounselorAssessmentReviewDetail assignmentId={assignmentId} />;
}

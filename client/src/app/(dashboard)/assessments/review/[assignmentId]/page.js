"use client";

import { use, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { CounselorAssessmentReviewDetail } from "@/features/assessments";

function ReviewDetailContent({ params }) {
  const resolvedParams = use(params);
  const assignmentId = resolvedParams?.assignmentId;

  return <CounselorAssessmentReviewDetail assignmentId={assignmentId} />;
}

function ReviewDetailFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
      <Loader2 className="size-10 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground font-medium">
        Loading assessment review...
      </p>
    </div>
  );
}

export default function AssessmentReviewDetailPage({ params }) {
  return (
    <Suspense fallback={<ReviewDetailFallback />}>
      <ReviewDetailContent params={params} />
    </Suspense>
  );
}

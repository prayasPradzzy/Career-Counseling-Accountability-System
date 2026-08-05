"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useStartOrResumeSession } from "@/features/assessments/hooks/useAssessmentSession";
import { StudentAssessmentRunner } from "@/features/assessments";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function DirectAssessmentPage({ params }) {
  const resolvedParams = use(params);
  const assignmentId = resolvedParams.assignmentId;
  const router = useRouter();

  const [sessionId, setSessionId] = useState(null);
  const startSessionMutation = useStartOrResumeSession();

  useEffect(() => {
    if (assignmentId) {
      startSessionMutation
        .mutateAsync(assignmentId)
        .then((res) => {
          const session = res?.data?.session || res?.session;
          const targetSessionId = session?._id || session?.id;
          if (targetSessionId) {
            setSessionId(targetSessionId);
          } else {
            toast.error("Failed to initialize session.");
            router.push("/assessments");
          }
        })
        .catch((err) => {
          toast.error(err?.response?.data?.message || "Failed to launch assessment.");
          router.push("/assessments");
        });
    }
  }, [assignmentId]);

  if (!sessionId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <Loader2 className="size-10 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">Initializing assessment session...</p>
      </div>
    );
  }

  return (
    <StudentAssessmentRunner
      sessionId={sessionId}
      onBack={() => router.push("/assessments")}
    />
  );
}

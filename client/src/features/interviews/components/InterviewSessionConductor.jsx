"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/StatusBadge";
import {
  CheckCircle2,
  Clock,
  Loader2,
  Play,
  TimerReset,
} from "lucide-react";
import { ConsentGateNotice } from "./ConsentGateNotice";
import { AudioUploadWidget } from "./AudioUploadWidget";
import { AudioPreviewPlayer, formatDuration } from "./AudioPreviewPlayer";
import {
  useStartInterviewSession,
  useCompleteInterviewSession,
} from "../hooks/useInterviews";

/** mm:ss / h:mm:ss from a milliseconds value */
function formatElapsed(ms) {
  return formatDuration(Math.floor(ms / 1000));
}

const STATUS_LABELS = {
  approved: "Approved — Ready to Conduct",
  in_progress: "In Progress",
  recorded: "Recorded — Awaiting Completion",
  completed: "Completed",
};

/**
 * InterviewSessionConductor — Phase 2: actually conducting the
 * approved session. Gated on audio-recording consent; walks the
 * statuses approved → in_progress → recorded → completed with a
 * live elapsed-vs-target indicator and a secure playback player.
 */
export function InterviewSessionConductor({
  session,
  audioConsentGiven = false,
  sessionTypeLabel = "Interview Session",
}) {
  const sessionId = session?.id || session?._id;
  const status = session?.status;
  const targetMinutes = session?.targetDuration || 45;
  const targetMs = targetMinutes * 60 * 1000;
  const conductedAt = session?.conductedAt ? new Date(session.conductedAt) : null;

  const startMutation = useStartInterviewSession();
  const completeMutation = useCompleteInterviewSession();

  // Live "now" tick so the elapsed indicator updates every second
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (status !== "in_progress") return undefined;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [status]);

  const elapsedMs = conductedAt && status === "in_progress" ? Math.max(0, now - conductedAt.getTime()) : 0;
  const overTarget = elapsedMs > targetMs;
  const elapsedPct = Math.min(100, Math.round((elapsedMs / targetMs) * 100));

  const handleStart = () => {
    startMutation.mutate(sessionId, {
      onSuccess: () => toast.success("Session started. Recording is now available."),
      onError: (err) => toast.error(err?.message || "Failed to start session."),
    });
  };

  const handleComplete = () => {
    completeMutation.mutate(sessionId, {
      onSuccess: () => toast.success("Session completed."),
      onError: (err) => toast.error(err?.message || "Failed to complete session."),
    });
  };

  return (
    <SectionCard
      title="Conduct Session"
      subtitle={`${sessionTypeLabel} · ${targetMinutes} min target`}
      iconName="Mic"
      action={
        status ? (
          <StatusBadge
            status={status}
            label={STATUS_LABELS[status] || status.replace(/_/g, " ")}
          />
        ) : null
      }
    >
      <div className="space-y-4 pt-1">
        {!audioConsentGiven ? (
          <ConsentGateNotice />
        ) : (
          <>
            {/* ── Approved: ready to start ── */}
            {status === "approved" && (
              <div className="flex items-center justify-between gap-3 flex-wrap p-4 rounded-xl border border-border bg-muted/20">
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-foreground">
                    Question set approved — ready to conduct
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Starting records the time and opens recording. Audio consent is on file.
                  </p>
                </div>
                <Button
                  onClick={handleStart}
                  disabled={startMutation.isPending}
                  className="gap-1.5 text-xs font-semibold"
                >
                  {startMutation.isPending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Play className="size-3.5" />
                  )}
                  Start Session
                </Button>
              </div>
            )}

            {/* ── In progress: elapsed timer + recording ── */}
            {status === "in_progress" && (
              <>
                <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 text-sm">
                      <TimerReset className="size-4 text-primary" />
                      <span className="font-semibold text-foreground tabular-nums">
                        {formatElapsed(elapsedMs)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        / {formatDuration(targetMs / 1000)}
                      </span>
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        overTarget ? "text-destructive" : "text-muted-foreground"
                      }`}
                    >
                      {overTarget
                        ? `Over target by ${formatElapsed(elapsedMs - targetMs)}`
                        : `${targetMinutes - Math.floor(elapsedMs / 60000)} min remaining`}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        overTarget ? "bg-destructive" : "bg-primary"
                      }`}
                      style={{ width: `${Math.max(2, elapsedPct)}%` }}
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-border p-4 space-y-2">
                  <p className="text-xs font-semibold text-foreground">
                    Record the session
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Record with your usual tool, then upload the file. Accepted
                    formats: MP3, WAV, M4A, AAC — max 200MB.
                  </p>
                  <AudioUploadWidget sessionId={sessionId} />
                </div>
              </>
            )}

            {/* ── Recorded: playback + complete ── */}
            {status === "recorded" && (
              <>
                <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-600" />
                    <p className="text-sm font-semibold text-foreground">
                      Recording uploaded
                    </p>
                  </div>
                  <AudioPreviewPlayer
                    sessionId={sessionId}
                    actualDuration={session?.actualDuration}
                  />
                  <div className="pt-1">
                    <AudioUploadWidget sessionId={sessionId} replace />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <p className="text-xs text-muted-foreground">
                    Review the recording, then mark the session complete.
                  </p>
                  <Button
                    onClick={handleComplete}
                    disabled={completeMutation.isPending}
                    className="gap-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {completeMutation.isPending ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="size-3.5" />
                    )}
                    Complete Session
                  </Button>
                </div>
              </>
            )}

            {/* ── Completed: summary ── */}
            {status === "completed" && (
              <div className="rounded-xl border border-emerald-600/30 bg-emerald-500/5 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-600" />
                  <p className="text-sm font-semibold text-foreground">Session completed</p>
                </div>
                <div className="grid gap-1.5 text-xs text-muted-foreground sm:grid-cols-2">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="size-3.5" />
                    Conducted:{" "}
                    {conductedAt
                      ? conductedAt.toLocaleString([], {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : "—"}
                  </span>
                  <span>
                    Real recording duration:{" "}
                    {session?.actualDuration
                      ? formatDuration(session.actualDuration)
                      : "—"}
                  </span>
                </div>
                {session?.audioAssetId && (
                  <AudioPreviewPlayer
                    sessionId={sessionId}
                    actualDuration={session?.actualDuration}
                  />
                )}
              </div>
            )}
          </>
        )}
      </div>
    </SectionCard>
  );
}

export default InterviewSessionConductor;

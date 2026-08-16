import { SectionCard } from "@/components/common/SectionCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { FileText, CheckCircle2, XCircle } from "lucide-react";

/**
 * ConsentCard Component
 * Displays student data consent status and allows toggling or viewing consent documents.
 * Also captures the separate audio-recording consent required before any
 * interview session recording (Phase 2 consent gate).
 */
export function ConsentCard({
  consentStatus,
  onUpdateConsent,
  isUpdating,
  onToggleAudioConsent,
  isUpdatingAudioConsent = false,
  className,
}) {
  const isGiven = Boolean(consentStatus?.isGiven);
  const givenAtFormatted = consentStatus?.givenAt
    ? new Date(consentStatus.givenAt).toLocaleDateString()
    : "N/A";
  const audioGiven = Boolean(consentStatus?.audioRecording?.isGiven);
  const audioGivenAt = consentStatus?.audioRecording?.givenAt
    ? new Date(consentStatus.audioRecording.givenAt).toLocaleDateString()
    : "N/A";

  return (
    <SectionCard
      title="Data Processing & Consent"
      subtitle="Student authorization for career guidance data processing and assessment storage"
      iconName="ShieldAlert"
      action={
        <StatusBadge
          status={isGiven ? "active" : "pending"}
          label={isGiven ? "Consent Granted" : "Consent Pending"}
        />
      }
      className={className}
    >
      <div className="space-y-4 pt-1">
        <div className="flex items-center justify-between text-sm p-3 rounded-lg border border-border bg-muted/30">
          <div className="flex items-center gap-2">
            {isGiven ? (
              <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="size-5 text-amber-500 shrink-0" />
            )}
            <div>
              <p className="font-medium text-foreground text-sm">
                {isGiven ? "Data Consent Authorized" : "Data Consent Missing"}
              </p>
              <p className="text-xs text-muted-foreground">
                {isGiven ? `Granted on ${givenAtFormatted}` : "Student has not submitted signed consent."}
              </p>
            </div>
          </div>

          {onUpdateConsent && (
            <Button
              variant={isGiven ? "outline" : "default"}
              size="sm"
              onClick={onUpdateConsent}
              disabled={isUpdating}
            >
              {isGiven ? "Revoke Consent" : "Grant Consent"}
            </Button>
          )}
        </div>

        {/* Audio recording consent (required before any interview recording) */}
        <div className="flex items-center justify-between text-sm p-3 rounded-lg border border-border bg-muted/30">
          <div className="flex items-center gap-2">
            {audioGiven ? (
              <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="size-5 text-amber-500 shrink-0" />
            )}
            <div>
              <p className="font-medium text-foreground text-sm">
                {audioGiven ? "Audio Recording Consent Authorized" : "Audio Recording Consent Missing"}
              </p>
              <p className="text-xs text-muted-foreground">
                {audioGiven
                  ? `Granted on ${audioGivenAt}`
                  : "Required before any interview session can be recorded."}
              </p>
            </div>
          </div>

          {onToggleAudioConsent && (
            <Button
              variant={audioGiven ? "outline" : "default"}
              size="sm"
              onClick={onToggleAudioConsent}
              disabled={isUpdatingAudioConsent}
            >
              {audioGiven ? "Revoke Audio Consent" : "Grant Audio Consent"}
            </Button>
          )}
        </div>

        {consentStatus?.consentFormUrl && (
          <a
            href={consentStatus.consentFormUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
          >
            <FileText className="size-3.5" />
            View Signed Consent Document (PDF)
          </a>
        )}
      </div>
    </SectionCard>
  );
}

export default ConsentCard;

import { AlertTriangle, ShieldCheck } from "lucide-react";

/**
 * ConsentGateNotice — hard gate before any recording can happen.
 * Shown (blocking) when the student has no audio-recording consent
 * on file. Points the counselor to where to capture it: the
 * Overview tab → "Data Processing & Consent" card.
 */
export function ConsentGateNotice() {
  return (
    <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-4 space-y-2">
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="size-4.5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
            Audio recording consent required
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            This session cannot be recorded or have audio uploaded until the
            student&apos;s audio-recording consent is captured. Recording without it
            is blocked by design.
          </p>
        </div>
      </div>
      <div className="flex items-start gap-2.5 pt-1">
        <ShieldCheck className="size-4.5 text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Capture consent on this student&apos;s profile:{" "}
          <span className="font-medium text-foreground">Overview tab → Data Processing &amp; Consent card</span>{" "}
          → toggle <span className="font-medium text-foreground">Audio Recording Consent</span>.
        </p>
      </div>
    </div>
  );
}

export default ConsentGateNotice;

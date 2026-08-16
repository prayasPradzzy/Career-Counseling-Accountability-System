"use client";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";

function SaveStatusIndicator({ saveStatus }) {
  return (
    <div className="flex items-center gap-1.5 font-medium">
      {saveStatus === "saving" && (
        <>
          <Loader2 className="size-3.5 animate-spin text-amber-500" />
          <span className="text-amber-600">Saving…</span>
        </>
      )}
      {saveStatus === "saved" && (
        <>
          <CheckCircle2 className="size-3.5 text-emerald-600" />
          <span className="text-emerald-700">Saved</span>
        </>
      )}
      {saveStatus === "unsaved" && (
        <>
          <AlertCircle className="size-3.5 text-destructive" />
          <span className="text-destructive">Unsaved</span>
        </>
      )}
    </div>
  );
}

/**
 * AssessmentProgressHeader — the single shared sticky header for every
 * assessment-taking screen (Likert, multi-select checklist, forced-rank sort).
 *
 * Sticky at the top of the page-content scroll container (which sits below the
 * app top nav), above question cards (z-20), solid
 * background with a subtle border/shadow so scrolled content never shows
 * through behind it.
 *
 * Props:
 *  - title: assessment name (string)
 *  - icon:  optional lucide icon rendered next to the title
 *  - badge: optional section/part label (string) rendered as a Badge
 *  - progressText: node/string, e.g. "12 of 120 answered (10%)" or
 *    "14 activities selected"
 *  - progressValue: optional 0–100 number → renders a progress bar
 *  - saveStatus: "saved" | "saving" | "unsaved"
 *  - timeSpent: seconds — accepted for backward compatibility, but NOT
 *    displayed: duration is tracked silently in the background (it feeds the
 *    avg-completion-time stats) while the student takes the test.
 *  - children: optional top slot (full-width, above the main row) — e.g. the
 *    WIL column-fill counter grid or the Interest Profiler instruction
 *  - extrasLeft: optional node rendered inline next to progressText — e.g. the
 *    WIL per-card dot row
 *  - actions: optional node rendered on the right — e.g. a submit button
 *  - footer: optional bottom slot — e.g. Likert section tabs or the WIL
 *    "place more cards" gate message
 */
export default function AssessmentProgressHeader({
  ref,
  title,
  icon: Icon,
  badge,
  progressText,
  progressValue,
  saveStatus = "saved",
  timeSpent = 0,
  children,
  extrasLeft,
  actions,
  footer,
  className = "",
}) {
  return (
    <div
      ref={ref}
      className={`sticky top-0 z-20 bg-background/95 backdrop-blur-md border border-border/80 rounded-xl shadow-md overflow-hidden ${className}`}
    >
      {children}

      <div className="p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          {/* Left: title + progress info */}
          <div className="space-y-1 min-w-0">
            <h3 className="font-bold text-base flex items-center gap-2">
              {Icon && <Icon className="size-4 text-primary shrink-0" />}
              <span className="truncate">{title}</span>
              {badge && (
                <Badge variant="secondary" className="text-[10px] font-mono shrink-0">
                  {badge}
                </Badge>
              )}
            </h3>
            <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
              {progressText}
              {extrasLeft}
            </div>
          </div>

          {/* Right: save status + actions (timer intentionally NOT shown —
              duration is tracked silently for the avg-completion-time stats) */}
          <div className="flex items-center gap-3 text-xs shrink-0">
            <SaveStatusIndicator saveStatus={saveStatus} />
            {actions}
          </div>
        </div>

        {progressValue !== undefined && progressValue !== null && (
          <Progress value={progressValue} className="h-2" />
        )}
      </div>

      {footer}
    </div>
  );
}

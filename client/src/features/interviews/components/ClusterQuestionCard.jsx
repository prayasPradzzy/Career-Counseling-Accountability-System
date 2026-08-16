"use client";

import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquareText, Trash2 } from "lucide-react";

// Distinct visual treatment per priority so a counselor can tell them
// apart at a glance, not just by reading badge text:
//   High   → solid accent badge, tinted card
//   Medium → outlined amber badge
//   Light  → plain muted gray badge
const PRIORITY_BADGE_STYLES = {
  // solid accent (default badge variant) — no extra classes needed
  high: "",
  medium:
    "bg-amber-500/10 text-amber-700 border-amber-500/40 dark:text-amber-400 dark:border-amber-500/30",
  light: "bg-muted text-muted-foreground border-border",
};

const PRIORITY_CARD_STYLES = {
  high: "border-primary/40 bg-primary/[0.03]",
  medium: "border-amber-500/30",
  light: "border-border bg-card",
};

const PRIORITY_LABELS = {
  high: "High Priority",
  medium: "Medium Priority",
  light: "Light Priority",
};

/**
 * ClusterQuestionCard — one interview cluster's questions with its
 * priority badge and rationale. Questions are inline-editable until
 * the set is approved.
 */
export function ClusterQuestionCard({
  clusterName,
  priority,
  rationale,
  questions = [],
  readOnly = false,
  onChange,
  onRemoveQuestion,
  onAddQuestion,
}) {
  const badgeStyle = PRIORITY_BADGE_STYLES[priority] ?? PRIORITY_BADGE_STYLES.light;
  const cardStyle = PRIORITY_CARD_STYLES[priority] ?? PRIORITY_CARD_STYLES.light;

  return (
    <div className={`rounded-xl border p-4 space-y-3 ${cardStyle}`}>
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="space-y-1">
          <h4 className="font-semibold text-sm text-foreground">{clusterName}</h4>
          <Badge
            variant={priority === "high" ? "default" : "outline"}
            className={`text-[10px] gap-1 font-bold ${badgeStyle}`}
          >
            {PRIORITY_LABELS[priority] || "Light Priority"}
          </Badge>
        </div>
        {rationale && (
          <p className="text-[11px] text-muted-foreground italic max-w-[60%] text-right">
            {rationale}
          </p>
        )}
      </div>

      <div className="space-y-2">
        {questions.length === 0 && !readOnly ? (
          <p className="text-xs text-muted-foreground">No questions for this cluster yet.</p>
        ) : (
          questions.map((q, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <Textarea
                value={q}
                readOnly={readOnly}
                onChange={(e) => onChange(idx, e.target.value)}
                rows={2}
                className="text-xs leading-relaxed resize-y"
              />
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => onRemoveQuestion(idx)}
                  className="mt-1.5 shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                  aria-label="Remove question"
                >
                  <Trash2 className="size-3.5" />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {!readOnly && (
        <button
          type="button"
          onClick={onAddQuestion}
          className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
        >
          <MessageSquareText className="size-3.5" />
          Add question
        </button>
      )}
    </div>
  );
}

export default ClusterQuestionCard;

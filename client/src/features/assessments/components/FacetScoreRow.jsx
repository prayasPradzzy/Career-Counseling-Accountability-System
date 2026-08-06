"use client";

import { Badge } from "@/components/ui/badge";

/**
 * FacetScoreRow
 * Reusable nested row component displaying a sub-trait facet score.
 * Uses neutral, muted colors regardless of score/band (no traffic-light red/green).
 */
export function FacetScoreRow({ facet }) {
  if (!facet) return null;

  const facetName = facet.facetName || facet.name || "Facet";
  const facetCode = facet.facet || facet.code || "";
  const rawScore = facet.rawScore ?? facet.score ?? 0;
  const band = facet.band || facet.qualitativeLevel || "";
  const percentage = facet.normalizedScore ?? Math.min(100, Math.max(0, Math.round(((rawScore - 1) / 4) * 100)));

  return (
    <div className="p-3 rounded-lg border border-border/60 bg-muted/20 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {facetCode && (
            <Badge variant="outline" className="text-[10px] py-0 px-1 font-mono shrink-0">
              {facetCode}
            </Badge>
          )}
          <span className="text-xs font-medium text-foreground truncate">{facetName}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {band && (
            <Badge variant="secondary" className="text-[10px] font-medium px-1.5 py-0">
              {band}
            </Badge>
          )}
          <span className="text-xs font-bold text-foreground font-mono">
            {typeof rawScore === "number" ? rawScore.toFixed(1) : rawScore} / 5.0
          </span>
        </div>
      </div>

      {/* Proportional horizontal bar fill using neutral muted tone */}
      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-slate-600 dark:bg-slate-400 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default FacetScoreRow;

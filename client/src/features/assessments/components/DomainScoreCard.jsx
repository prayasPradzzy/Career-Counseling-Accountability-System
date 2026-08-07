"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import FacetScoreRow from "./FacetScoreRow";

/**
 * DomainScoreCard
 * Reusable domain-level result card displaying domain name, numeric score, band label,
 * neutral horizontal bar, interpretation sentence, and expandable nested facet rows.
 * Uses neutral, muted colors regardless of score/band (no traffic-light red/green).
 */
export function DomainScoreCard({ domain, defaultExpanded = false }) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (!domain) return null;

  const domainName = domain.dimensionName || domain.domainName || domain.name || "Domain";
  const domainCode = domain.domain || domain.code || "";
  const rawScore = domain.score ?? domain.rawScore ?? 0;
  const band = domain.band || domain.qualitativeLevel || "Moderate";
  const interpretation = domain.interpretation || domain.desc || "";
  const facetScores = domain.facetScores || [];

  const maxScore = domain.maxScore ?? (rawScore > 5 ? 10 : 5);
  const percentage =
    domain.normalizedScore ??
    Math.min(
      100,
      Math.max(
        0,
        Math.round(maxScore === 10 ? (rawScore / 10) * 100 : Math.max(0, ((rawScore - 1) / 4) * 100))
      )
    );

  return (
    <div className="p-4 rounded-xl border border-border/60 bg-card space-y-3 shadow-xs">
      {/* Domain Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {domainCode && (
            <Badge variant="outline" className="font-bold text-xs py-0.5 px-2 font-mono shrink-0">
              {domainCode}
            </Badge>
          )}
          <h4 className="font-semibold text-base text-foreground truncate">{domainName}</h4>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Badge variant="secondary" className="text-xs font-semibold px-2.5 py-0.5">
            {band}
          </Badge>
          <span className="text-sm font-bold text-foreground font-mono">
            {typeof rawScore === "number" ? (maxScore === 10 ? `${rawScore}` : rawScore.toFixed(1)) : rawScore} / {maxScore}
          </span>
          {facetScores.length > 0 && (
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-muted-foreground hover:text-foreground"
              aria-label={isExpanded ? "Collapse sub-facets" : "Expand sub-facets"}
            >
              {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </Button>
          )}
        </div>
      </div>

      {/* Proportional horizontal bar fill — neutral muted tone */}
      <div className="space-y-1">
        <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-slate-700 dark:bg-slate-300 rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* One-sentence Interpretation directly under the bar */}
      {interpretation && (
        <p className="text-xs text-muted-foreground leading-relaxed pt-0.5">
          {interpretation}
        </p>
      )}

      {/* Collapsible Facet Drill-Down */}
      {isExpanded && facetScores.length > 0 && (
        <div className="pt-3 border-t border-border/40 space-y-2">
          <div className="flex items-center justify-between pb-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Facet Breakdown ({facetScores.length})
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {facetScores.map((facetItem, fIdx) => (
              <FacetScoreRow key={fIdx} facet={facetItem} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default DomainScoreCard;

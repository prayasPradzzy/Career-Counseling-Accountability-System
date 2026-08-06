"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, FileText, CheckCircle2 } from "lucide-react";
import DomainScoreCard from "./DomainScoreCard";

/**
 * AssessmentResultsPanel
 * Main counselor-facing results viewer displaying Header, Domain Score Cards,
 * expandable Facet Drill-downs, and Footer Note.
 */
export function AssessmentResultsPanel({
  score,
  title = "IPIP-NEO-120 — Personality Assessment",
  completedAt = null,
  statusLabel = "Scored",
  onBack = null,
}) {
  if (!score) return null;

  const domainScores = score.domainScores || score.dimensionScores || [];
  const dateFormatted = completedAt || score.computedAt || score.calculatedAt
    ? new Date(completedAt || score.computedAt || score.calculatedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Recently Scored";

  return (
    <div className="space-y-6">
      {/* 1. Results Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button
              variant="outline"
              size="icon-sm"
              onClick={onBack}
              className="shrink-0"
              aria-label="Back to assessments"
            >
              <ArrowLeft className="size-4" />
            </Button>
          )}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold tracking-tight text-foreground">{title}</h2>
              <Badge variant="emerald" className="text-xs gap-1">
                <CheckCircle2 className="size-3" />
                {statusLabel}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              <Calendar className="size-3.5" />
              <span>Completed on {dateFormatted}</span>
              {score.overallCode && (
                <>
                  <span>•</span>
                  <span className="font-mono font-medium text-foreground">Profile: {score.overallCode}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Domain Summary Cards (5 Domains) */}
      <div className="space-y-4">
        {domainScores.map((domainItem, idx) => (
          <DomainScoreCard
            key={domainItem.domain || domainItem.dimensionName || idx}
            domain={domainItem}
            defaultExpanded={false}
          />
        ))}
      </div>

      {/* 3. Footer Note */}
      <div className="pt-2 border-t border-border/40 flex items-center gap-1.5 text-xs text-muted-foreground italic">
        <FileText className="size-3.5 shrink-0" />
        <span>Full narrative report generation coming soon</span>
      </div>
    </div>
  );
}

export default AssessmentResultsPanel;

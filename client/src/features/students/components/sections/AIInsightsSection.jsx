import { SectionCard } from "@/components/common/SectionCard";
import { Badge } from "@/components/ui/badge";
import { BrainCircuit, Sparkles, FileText, Activity } from "lucide-react";

export function AIInsightsSection({ insights }) {
  return (
    <div className="space-y-6">
      <SectionCard
        title="AI-Powered Career & Speech Insights"
        subtitle="Automated Speech-to-Text transcript analysis, OCR academic document parsing, and sentiment evaluation"
        iconName="BrainCircuit"
        action={
          <Badge variant="outline" className="text-xs text-primary border-primary/30">
            <Sparkles className="mr-1 size-3 text-amber-500" />
            AI Integration Plug-in Ready
          </Badge>
        }
      >
        <div className="space-y-4 pt-2">
          {/* Extension Card 1: Speech-to-Text Session Transcript Analysis */}
          <div className="p-4 rounded-lg border border-border bg-gradient-to-r from-primary/5 via-card to-card space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                <Activity className="size-4 text-primary" />
                Session Speech-to-Text & Sentiment Analysis
              </h4>
              <Badge variant="secondary" className="text-[10px]">
                Confidence: 94%
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              &quot;Student expressed high intrinsic motivation for Software Architecture and AI research.
              Sentiment analysis scored +0.82 (High Positive Career Enthusiasm). Zero career anxiety indicators detected.&quot;
            </p>
          </div>

          {/* Extension Card 2: OCR Academic Document Parsing */}
          <div className="p-4 rounded-lg border border-border bg-card space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                <FileText className="size-4 text-emerald-500" />
                OCR Academic Transcript Extraction
              </h4>
              <Badge variant="outline" className="text-[10px]">
                2 Documents Parsed
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Extracted High School Grade Transcript: Mathematics (A+), Computer Science (A+), Physics (A).
              Calculated STEM Competency Index: 95/100.
            </p>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

export default AIInsightsSection;

import { SectionCard } from "@/components/common/SectionCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Compass, TrendingUp, Sparkles, ArrowRight } from "lucide-react";

export function RecommendationsSection({ recommendations = [] }) {
  const list = recommendations.length > 0 ? recommendations : [
    {
      id: "rec-1",
      title: "AI & Systems Architect",
      industry: "Technology & Computing",
      matchPercentage: 96,
      growthMetric: "+24% Annual Demand",
      keySkills: ["Python", "System Architecture", "Deep Learning"],
      rationale: "Matches Holland RIASEC Investigative/Artistic code and STEM 94th percentile aptitude score.",
    },
    {
      id: "rec-2",
      title: "UX Research Specialist",
      industry: "Design & Product",
      matchPercentage: 91,
      growthMetric: "+18% Annual Demand",
      keySkills: ["User Testing", "Prototyping", "Design Systems"],
      rationale: "Aligns with strong creative problem solving and spatial design perception.",
    },
  ];

  return (
    <div className="space-y-6">
      <SectionCard
        title="Career Path Recommendations"
        subtitle="Data-driven career recommendations matched with labor market trends and psychometric scores"
        iconName="Compass"
        action={
          <Badge variant="outline" className="text-xs text-primary border-primary/30">
            <Sparkles className="mr-1 size-3 text-amber-500" />
            Recommendation Engine Plug-in Ready
          </Badge>
        }
      >
        <div className="space-y-4 pt-2">
          {list.map((item) => (
            <div key={item.id} className="p-4 rounded-lg border border-border bg-card space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm text-foreground">{item.title}</h4>
                    <Badge variant="secondary" className="text-[10px]">
                      {item.industry}
                    </Badge>
                  </div>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    {item.growthMetric}
                  </span>
                </div>

                <Badge variant="default" className="text-xs font-bold shrink-0 w-fit">
                  {item.matchPercentage}% Match
                </Badge>
              </div>

              <p className="text-xs text-muted-foreground">{item.rationale}</p>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {item.keySkills.map((sk, i) => (
                  <Badge key={i} variant="outline" className="text-[11px]">
                    {sk}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

export default RecommendationsSection;

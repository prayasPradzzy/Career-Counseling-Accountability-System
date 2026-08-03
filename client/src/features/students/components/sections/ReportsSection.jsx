import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/ui/button";
import { FileText, Download, CheckCircle2, Sparkles } from "lucide-react";

export function ReportsSection({ reports = [] }) {
  const reportList = reports.length > 0 ? reports : [
    {
      id: "rep-1",
      title: "Quarterly Comprehensive Guidance & Aptitude Analysis Report",
      counselorName: "Dr. Sarah Jenkins",
      publishedAt: "Aug 1, 2026",
      summary:
        "Comprehensive PDF summarizing psychometric test scores, academic transcript evaluations, counselor interview observations, and target career pathway recommendations.",
      status: "published",
    },
  ];

  return (
    <div className="space-y-6">
      <SectionCard
        title="Published Guidance & Career Reports"
        subtitle="Official documented reports generated post-assessment and post-session"
        iconName="FileText"
      >
        <div className="space-y-4 pt-2">
          {reportList.map((item) => (
            <div key={item.id} className="p-4 rounded-lg border border-border bg-card space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <h4 className="font-semibold text-sm text-foreground">{item.title}</h4>
                  <p className="text-xs text-muted-foreground">
                    Issued by <span className="font-medium text-foreground">{item.counselorName}</span> on {item.publishedAt}
                  </p>
                </div>
                <Button size="sm" className="text-xs gap-1.5 shrink-0">
                  <Download className="size-3.5" />
                  Download Report (PDF)
                </Button>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">{item.summary}</p>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

export default ReportsSection;

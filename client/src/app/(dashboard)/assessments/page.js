"use client";

import { mockAssessmentsData } from "@/data/assessments";
import { PageHeader } from "@/components/layout/PageHeader";
import { WidgetGrid } from "@/components/layout/WidgetGrid";
import { SectionCard } from "@/components/common/SectionCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Clock, HelpCircle } from "lucide-react";

export default function AssessmentsPage() {
  const { assessments } = mockAssessmentsData;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Career Assessments"
        subtitle="Take AI-powered psychometric, interest, and skill assessments to unlock personalized recommendations."
      />

      {/* Assessment Library Grid consuming mockAssessmentsData */}
      <WidgetGrid cols={{ default: 1, md: 2 }} gap="gap-6">
        {assessments.map((item) => {
          const isComingSoon = item.status === "Coming Soon";

          return (
            <SectionCard
              key={item.id}
              title={item.title}
              subtitle={`${item.category} Category`}
              iconName={item.iconName}
              action={
                <Badge variant={item.statusVariant} className="shrink-0">
                  {item.status}
                </Badge>
              }
              footer={
                <Button
                  className="w-full font-semibold shadow"
                  disabled={isComingSoon}
                  variant={isComingSoon ? "secondary" : "default"}
                >
                  <BookOpen className="mr-2 size-4" />
                  {isComingSoon ? "Coming Soon" : "Start Assessment"}
                </Button>
              }
            >
              <div className="space-y-4 pt-1">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>

                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border/60">
                  <div className="flex items-center gap-1.5">
                    <Clock className="size-3.5" />
                    <span>{item.durationMinutes} mins</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <HelpCircle className="size-3.5" />
                    <span>{item.questionCount} questions</span>
                  </div>
                </div>
              </div>
            </SectionCard>
          );
        })}
      </WidgetGrid>
    </div>
  );
}

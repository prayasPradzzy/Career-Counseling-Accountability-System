"use client";

import { mockSessionsData } from "@/data/sessions";
import { PageHeader } from "@/components/layout/PageHeader";
import { WidgetGrid } from "@/components/layout/WidgetGrid";
import { StatCard } from "@/components/common/StatCard";
import { EmptyIllustration } from "@/components/common/EmptyIllustration";
import { SectionCard } from "@/components/common/SectionCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "lucide-react";

export default function SessionsPage() {
  const { stats } = mockSessionsData;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Counseling Sessions"
        subtitle="Schedule, manage, and review your 1-on-1 career counseling appointments."
        actions={[
          {
            id: "schedule-session-btn",
            label: "Schedule Session",
            variant: "default",
            iconName: "Plus",
            onClick: () => {},
          },
        ]}
      />

      {/* Stat Cards Grid consuming mockSessionsData */}
      <WidgetGrid cols={{ default: 1, sm: 3 }}>
        <StatCard
          title="Upcoming Sessions"
          value={stats.upcomingCount}
          note="No active appointments scheduled"
          iconName="Calendar"
          variant="default"
        />
        <StatCard
          title="Completed Sessions"
          value={stats.completedCount}
          note={`${stats.totalHours} total guidance hours completed`}
          iconName="Check"
          variant="success"
        />
        <StatCard
          title="Next Appointment"
          value={stats.nextAppointment}
          note="Connect with a counselor to get started"
          iconName="Clock"
          variant="warning"
        />
      </WidgetGrid>

      {/* Tabs View */}
      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList className="bg-muted p-1 rounded-lg">
          <TabsTrigger value="upcoming">Upcoming Sessions</TabsTrigger>
          <TabsTrigger value="past">Past Sessions</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          <EmptyIllustration
            iconName="Calendar"
            title="No Upcoming Sessions"
            description="You don't have any counseling appointments scheduled. Connect with an expert counselor to book your session."
            actionLabel="Browse Counselors"
            actionHref="/counselors"
          />
        </TabsContent>

        <TabsContent value="past">
          <EmptyIllustration
            iconName="Clock"
            title="No Past Sessions"
            description="Completed session notes and recording summaries will appear here after your first appointment."
          />
        </TabsContent>

        <TabsContent value="calendar">
          <SectionCard
            title="Calendar View"
            subtitle="Interactive monthly session booking calendar view."
            iconName="Calendar"
          >
            <div className="h-64 flex items-center justify-center border border-dashed border-border rounded-lg bg-muted/20 my-2">
              <div className="text-center space-y-2">
                <Calendar className="size-8 text-muted-foreground mx-auto" />
                <p className="text-sm font-medium text-muted-foreground">Interactive booking calendar placeholder</p>
              </div>
            </div>
          </SectionCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}

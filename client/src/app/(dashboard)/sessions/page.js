"use client";

import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { clientService } from "@/services/client.service";
import { PageHeader } from "@/components/layout/PageHeader";
import { WidgetGrid } from "@/components/layout/WidgetGrid";
import { StatCard } from "@/components/common/StatCard";
import { EmptyIllustration } from "@/components/common/EmptyIllustration";
import { LoadingSkeleton } from "@/components/layout/LoadingSkeleton";
import { SectionCard } from "@/components/common/SectionCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "lucide-react";

export default function SessionsPage() {
  const { user, isLoading: authLoading } = useAuth();

  const { data: sessionsRes, isLoading: sessionsLoading } = useQuery({
    queryKey: ["client-sessions-list", user?._id],
    queryFn: async () => {
      try {
        const res = await clientService.getClientSessions(user?._id);
        return res;
      } catch (err) {
        return { data: { sessions: [] } };
      }
    },
    enabled: Boolean(user?._id),
  });

  const isLoading = authLoading || (Boolean(user?._id) && sessionsLoading);

  const sessions = sessionsRes?.data?.sessions || sessionsRes?.sessions || [];

  const upcomingSessions = sessions.filter((s) => s.status === "SCHEDULED" || s.status === "CONFIRMED");
  const pastSessions = sessions.filter((s) => s.status === "COMPLETED");

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Counseling Sessions" subtitle="Loading your appointments..." />
        <LoadingSkeleton cards={3} />
      </div>
    );
  }

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

      {/* Stat Cards Grid */}
      <WidgetGrid cols={{ default: 1, sm: 3 }}>
        <StatCard
          title="Upcoming Sessions"
          value={upcomingSessions.length}
          note={upcomingSessions.length > 0 ? `${upcomingSessions.length} session(s) scheduled` : "No active appointments scheduled"}
          iconName="Calendar"
          variant="default"
        />
        <StatCard
          title="Completed Sessions"
          value={pastSessions.length}
          note={`${pastSessions.length} total guidance hour(s) completed`}
          iconName="Check"
          variant="success"
        />
        <StatCard
          title="Next Appointment"
          value={upcomingSessions.length > 0 ? "Scheduled" : "None"}
          note={upcomingSessions.length > 0 ? "Connect with your counselor" : "Connect with a counselor to get started"}
          iconName="Clock"
          variant="warning"
        />
      </WidgetGrid>

      {/* Tabs View */}
      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList className="bg-muted p-1 rounded-lg">
          <TabsTrigger value="upcoming">Upcoming Sessions ({upcomingSessions.length})</TabsTrigger>
          <TabsTrigger value="past">Past Sessions ({pastSessions.length})</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          {upcomingSessions.length > 0 ? (
            <div className="space-y-3">
              {upcomingSessions.map((session) => (
                <SectionCard
                  key={session._id || session.id}
                  title={session.title || "Career Counseling Session"}
                  subtitle={`Scheduled: ${new Date(session.scheduledAt || Date.now()).toLocaleString()}`}
                  iconName="Calendar"
                >
                  <p className="text-xs text-muted-foreground pt-1">
                    Meeting Link: {session.meetingLink || "To be provided by counselor"}
                  </p>
                </SectionCard>
              ))}
            </div>
          ) : (
            <EmptyIllustration
              iconName="Calendar"
              title="No Upcoming Sessions"
              description="You don't have any counseling appointments scheduled. Connect with an expert counselor to book your session."
              actionLabel="Browse Counselors"
              actionHref="/counselors"
            />
          )}
        </TabsContent>

        <TabsContent value="past">
          {pastSessions.length > 0 ? (
            <div className="space-y-3">
              {pastSessions.map((session) => (
                <SectionCard
                  key={session._id || session.id}
                  title={session.title || "Completed Counseling Session"}
                  subtitle={`Completed: ${new Date(session.completedAt || session.scheduledAt || Date.now()).toLocaleDateString()}`}
                  iconName="Check"
                >
                  <p className="text-xs text-muted-foreground pt-1">
                    Notes: {session.counselorNotes || "Session completed successfully."}
                  </p>
                </SectionCard>
              ))}
            </div>
          ) : (
            <EmptyIllustration
              iconName="Clock"
              title="No Past Sessions"
              description="Completed session notes and recording summaries will appear here after your first appointment."
            />
          )}
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
                <p className="text-sm font-medium text-muted-foreground">Interactive booking calendar</p>
              </div>
            </div>
          </SectionCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}

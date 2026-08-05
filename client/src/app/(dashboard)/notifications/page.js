"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { ActivityCard } from "@/components/common/ActivityCard";
import { EmptyIllustration } from "@/components/common/EmptyIllustration";
import { LoadingSkeleton } from "@/components/layout/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function NotificationsPage() {
  const { user, isLoading } = useAuth();
  const [notifications, setNotifications] = useState([]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Notifications" subtitle="Loading alerts..." />
        <LoadingSkeleton cards={3} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        subtitle="Stay updated with session reminders, assessment results, and counselor messages."
        actions={[
          {
            id: "mark-all-read",
            label: "Mark All Read",
            variant: "outline",
            iconName: "Check",
            onClick: handleMarkAllRead,
            disabled: unreadCount === 0,
          },
        ]}
      />

      {notifications.length > 0 ? (
        <div className="space-y-6 max-w-4xl">
          {/* Action Header Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">
                All Alerts
              </span>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="rounded-full text-xs">
                  {unreadCount} Unread
                </Badge>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="text-xs text-muted-foreground hover:text-destructive"
            >
              Clear All Notifications
            </Button>
          </div>

          <div className="space-y-2">
            {notifications.map((item) => (
              <ActivityCard
                key={item.id}
                title={item.title}
                description={item.description}
                timestamp={item.time}
                iconName={item.iconName || "Bell"}
                className={!item.read ? "bg-primary/5 border-primary/20" : ""}
              />
            ))}
          </div>
        </div>
      ) : (
        <EmptyIllustration
          iconName="Bell"
          title="No Notifications"
          description="You're all caught up! New alerts, test completion notices, and session reminders will appear here."
        />
      )}
    </div>
  );
}

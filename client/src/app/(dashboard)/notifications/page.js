"use client";

import { useState } from "react";
import { mockNotificationsData } from "@/data/notifications";
import { PageHeader } from "@/components/layout/PageHeader";
import { ActivityCard } from "@/components/common/ActivityCard";
import { EmptyIllustration } from "@/components/common/EmptyIllustration";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(mockNotificationsData.notifications);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  const groups = ["Today", "Yesterday", "Earlier"];

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

          {/* Grouped Alert Cards consuming mockNotificationsData */}
          {groups.map((groupName) => {
            const items = notifications.filter((n) => n.group === groupName);
            if (items.length === 0) return null;

            return (
              <div key={groupName} className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
                  {groupName}
                </h3>

                <div className="space-y-2">
                  {items.map((item) => (
                    <ActivityCard
                      key={item.id}
                      title={item.title}
                      description={item.description}
                      timestamp={item.time}
                      iconName={item.iconName}
                      className={!item.read ? "bg-primary/5 border-primary/20" : ""}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyIllustration
          iconName="Bell"
          title="No Notifications"
          description="You're all caught up! New alerts and session reminders will appear here."
        />
      )}
    </div>
  );
}

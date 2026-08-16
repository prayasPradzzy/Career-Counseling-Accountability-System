"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyIllustration } from "@/components/common/EmptyIllustration";
import { LoadingSkeleton } from "@/components/layout/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useNotifications,
  useMarkAllRead,
  useMarkOneRead,
  useClearAllNotifications,
} from "@/features/notifications/hooks/useNotifications";
import {
  Bell,
  ClipboardCheck,
  BookOpen,
  Mic,
  RotateCcw,
  ChevronRight,
  Loader2,
} from "lucide-react";

const TYPE_META = {
  assessment_retake: { icon: RotateCcw, className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30" },
  assessment_assigned: { icon: BookOpen, className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30" },
  assessment_completed: { icon: ClipboardCheck, className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" },
  interview_recorded: { icon: Mic, className: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/30" },
  general: { icon: Bell, className: "bg-muted text-muted-foreground border-border/60" },
};

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function NotificationsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const { data, isLoading } = useNotifications();
  const markAllMutation = useMarkAllRead();
  const markOneMutation = useMarkOneRead();
  const clearAllMutation = useClearAllNotifications();

  const notifications = data?.data || data || [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleOpen = (notification) => {
    if (!notification.read) {
      markOneMutation.mutate(notification.id || notification._id);
    }
    if (notification.link) {
      router.push(notification.link);
    }
  };

  if (authLoading || (Boolean(user?._id) && isLoading)) {
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
        subtitle="Assessment assignments, completions, retake requests, and interview recordings."
        actions={[
          {
            id: "mark-all-read",
            label: "Mark All Read",
            variant: "outline",
            iconName: "Check",
            onClick: () => markAllMutation.mutate(),
            disabled: unreadCount === 0 || markAllMutation.isPending,
          },
        ]}
      />

      {notifications.length > 0 ? (
        <div className="space-y-6 max-w-4xl">
          {/* Action Header Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">All Alerts</span>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="rounded-full text-xs">
                  {unreadCount} Unread
                </Badge>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => clearAllMutation.mutate()}
              disabled={clearAllMutation.isPending}
              className="text-xs text-muted-foreground hover:text-destructive"
            >
              {clearAllMutation.isPending ? "Clearing..." : "Clear All Notifications"}
            </Button>
          </div>

          <div className="space-y-2">
            {notifications.map((item) => {
              const meta = TYPE_META[item.type] || TYPE_META.general;
              const Icon = meta.icon;
              const isUnread = !item.read;

              return (
                <button
                  key={item.id || item._id}
                  type="button"
                  onClick={() => handleOpen(item)}
                  className={`group w-full text-left flex items-start gap-3 rounded-xl border p-4 transition-all hover:shadow-sm ${
                    isUnread
                      ? "bg-primary/5 border-primary/20 hover:border-primary/40"
                      : "bg-card border-border/60 hover:border-border"
                  }`}
                >
                  <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg border ${meta.className}`}>
                    <Icon className="size-4" />
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className={`text-sm truncate ${isUnread ? "font-bold text-foreground" : "font-semibold text-muted-foreground"}`}>
                        {item.title}
                      </h4>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {timeAgo(item.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-0.5 line-clamp-2">
                      {item.message}
                    </p>
                    {item.link && (
                      <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-primary mt-1 group-hover:underline">
                        View
                        <ChevronRight className="size-3" />
                      </span>
                    )}
                  </div>

                  {isUnread && (
                    <span className="size-2 shrink-0 mt-1.5 rounded-full bg-destructive" aria-label="Unread" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ) : isLoading ? (
        <LoadingSkeleton cards={3} />
      ) : (
        <EmptyIllustration
          iconName="Bell"
          title="No Notifications"
          description="You're all caught up! Assessment assignments, completions, retake requests, and interview recordings will appear here."
        />
      )}
    </div>
  );
}

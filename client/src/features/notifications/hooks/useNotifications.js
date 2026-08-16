import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/services/notification.service";

export const notificationKeys = {
  all: ["notifications"],
  list: () => [...notificationKeys.all, "list"],
  unread: () => [...notificationKeys.all, "unread"],
};

/** Fetch my notifications (newest first) */
export function useNotifications() {
  return useQuery({
    queryKey: notificationKeys.list(),
    queryFn: () => notificationService.getMyNotifications(),
    refetchInterval: 1000 * 60, // poll every minute so the bell stays fresh
  });
}

/** Mark one notification read (on click) */
export function useMarkOneRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => notificationService.markOneRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

/** Mark all notifications read */
export function useMarkAllRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

/** Clear all notifications */
export function useClearAllNotifications() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationService.clearAll(),
    onSuccess: () => {
      queryClient.setQueryData(notificationKeys.list(), { data: { data: [] } });
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

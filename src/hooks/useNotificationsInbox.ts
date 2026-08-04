import { queryClient } from "@/app/_layout";
import { useMutation } from "@/hooks/useMutation";
import { notificationsInboxApi } from "@/services/notifications-inbox.api";
import { useQuery } from "@tanstack/react-query";

const KEYS = {
  list: () => ["notifications", "list"] as const,
  unreadCount: () => ["notifications", "unread-count"] as const,
};

export function useNotificationsList() {
  return useQuery({
    queryKey: KEYS.list(),
    queryFn: () => notificationsInboxApi.list().then((r) => r.data),
  });
}

export function useNotificationsUnreadCount() {
  return useQuery({
    queryKey: KEYS.unreadCount(),
    queryFn: () => notificationsInboxApi.unreadCount().then((r) => r.data.count),
  });
}

export function useMarkNotificationRead() {
  return useMutation({
    mutationFn: (id: string) => notificationsInboxApi.markRead(id),
    triggerHaptics: false,
    showErrorToast: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: KEYS.list() });
      void queryClient.invalidateQueries({ queryKey: KEYS.unreadCount() });
    },
  });
}

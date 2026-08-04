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

/**
 * Drives the bell tab badge. Its observer lives in `(tabs)/_layout.tsx`, which
 * mounts once and never unmounts for the whole session — so `refetchOnMount`
 * never fires again and, without a poll, the count stays frozen at whatever it
 * was at login. The event-driven refreshes in `app/_layout.tsx` (foreground
 * FCM, return from background) don't cover a notification persisted server-side
 * while the app sat in the foreground with no push delivered (simulator with no
 * APNs token, a stale/invalidated token, or a row written straight to the DB).
 * A one-per-minute COUNT keeps the badge honest in those cases.
 */
export function useNotificationsUnreadCount() {
  return useQuery({
    queryKey: KEYS.unreadCount(),
    queryFn: () => notificationsInboxApi.unreadCount().then((r) => r.data.count),
    refetchInterval: 60_000,
  });
}

export function useMarkNotificationRead() {
  return useMutation({
    mutationFn: (id: string) => notificationsInboxApi.markRead(id),
    triggerHaptics: false,
    showErrorToast: false,
    onSuccess: invalidateNotifications,
  });
}

export function useMarkAllNotificationsRead() {
  return useMutation({
    mutationFn: () => notificationsInboxApi.markAllRead(),
    showErrorToast: false,
    onSuccess: invalidateNotifications,
  });
}

/**
 * Refresh the inbox and the tab badge after a mutation. Incoming pushes and
 * returns from background are handled in `app/_layout.tsx`, which invalidates
 * the same `["notifications"]` prefix directly.
 */
function invalidateNotifications(): void {
  void queryClient.invalidateQueries({ queryKey: KEYS.list() });
  void queryClient.invalidateQueries({ queryKey: KEYS.unreadCount() });
}

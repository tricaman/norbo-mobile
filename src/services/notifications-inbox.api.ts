import { api } from "./api";
import type { InboxNotification } from "@/types/notifications.types";

export const notificationsInboxApi = {
  list: () => api.get<InboxNotification[]>("/me/notifications"),
  unreadCount: () =>
    api.get<{ count: number }>("/me/notifications/unread-count"),
  markRead: (id: string) =>
    api.patch<void>(`/me/notifications/${encodeURIComponent(id)}/read`),
  markAllRead: () => api.patch<void>("/me/notifications/read-all"),
} as const;

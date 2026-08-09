import type {
  BadgeDetail,
  BadgeSummary,
  MarkBadgeSeenPayload,
} from "@/types/badge.types";
import { api } from "./api";

/**
 * All copy comes back already localized: the axios interceptor injects
 * `Accept-Language`, and the server resolves badge/tier text from it. There is
 * deliberately nothing to translate client-side beyond the screen chrome.
 */
export const badgesApi = {
  list: () => api.get<BadgeSummary[]>("/me/badges"),
  get: (id: string) =>
    api.get<BadgeDetail>(`/me/badges/${encodeURIComponent(id)}`),
  markSeen: (payload: MarkBadgeSeenPayload) =>
    api.post<void>("/me/badges/seen", payload),
} as const;

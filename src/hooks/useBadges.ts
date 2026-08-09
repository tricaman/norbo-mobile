import { useMutation } from "@/hooks/useMutation";
import { badgesApi } from "@/services/badges.api";
import type { MarkBadgeSeenPayload } from "@/types/badge.types";
import { useQuery } from "@tanstack/react-query";

const KEYS = {
  list: () => ["badges"] as const,
  detail: (id: string) => ["badges", id] as const,
};

export function useBadges() {
  return useQuery({
    queryKey: KEYS.list(),
    queryFn: () => badgesApi.list().then((r) => r.data),
  });
}

export function useBadge(id: string | null) {
  return useQuery({
    queryKey: KEYS.detail(id ?? ""),
    queryFn: () => badgesApi.get(id as string).then((r) => r.data),
    enabled: !!id,
  });
}

/**
 * How many tier unlocks the user has not celebrated yet — the pill on the
 * profile row. Derived from the list, so it needs no store of its own and
 * stays consistent with what the badge screen will actually show.
 */
export function useBadgeUnseen(): number {
  const list = useBadges().data;
  if (!list) return 0;
  return list.reduce(
    (count, badge) => count + Math.max(0, badge.currentLevel - badge.seenLevel),
    0,
  );
}

/**
 * Acknowledges a celebration. Deliberately silent — no haptic, no toast, no
 * error surface: this is UI bookkeeping, and the worst case of a lost call is
 * one modal shown twice. The success haptic belongs to the celebration itself.
 */
export function useMarkBadgeSeen() {
  return useMutation({
    mutationFn: (payload: MarkBadgeSeenPayload) => badgesApi.markSeen(payload),
    triggerHaptics: false,
    showSuccessToast: false,
    showErrorToast: false,
  });
}

export const BADGE_QUERY_KEYS = KEYS;

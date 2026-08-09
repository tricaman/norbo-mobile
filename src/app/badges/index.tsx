import { BadgeDetailSheet } from "@/components/badges/BadgeDetailSheet";
import { BadgeTile } from "@/components/badges/BadgeTile";
import { BadgeUnlockOverlay } from "@/components/badges/BadgeUnlockOverlay";
import { EmptyState } from "@/components/ui/EmptyState";
import { QueryBoundary } from "@/components/ui/QueryBoundary";
import { Screen } from "@/components/ui/Screen";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { SCREEN_BOTTOM_PADDING } from "@/constants/layout";
import {
  BADGE_QUERY_KEYS,
  useBadges,
  useMarkBadgeSeen,
} from "@/hooks/useBadges";
import type { BadgeSummary } from "@/types/badge.types";
import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, RefreshControl, useWindowDimensions } from "react-native";
import { useUnistyles } from "react-native-unistyles";

/**
 * Breakpoints for grid layout based on screen width. Badges are smaller than
 * pet cards, so this grid is denser than the one in pets/index.tsx.
 */
const BREAKPOINTS = {
  PORTRAIT: 768, // 4 columns
  LANDSCAPE: 1024, // 5 columns
};

function getNumColumns(width: number): number {
  if (width >= BREAKPOINTS.LANDSCAPE) return 5;
  if (width >= BREAKPOINTS.PORTRAIT) return 4;
  return 3;
}

/** One pending celebration: a badge plus the specific tier to celebrate. */
interface PendingUnlock {
  badge: BadgeSummary;
  level: number;
}

export default function BadgesScreen() {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const { width: windowWidth } = useWindowDimensions();
  const queryClient = useQueryClient();

  // A push tap lands here with the badge to open — the detail is a sheet, not
  // a route, so the deep link only has to seed this state.
  const { badgeId } = useLocalSearchParams<{ badgeId?: string }>();
  const [selected, setSelected] = useState<string | null>(badgeId ?? null);

  const query = useBadges();
  const markSeen = useMarkBadgeSeen();
  const [cursor, setCursor] = useState(0);

  const numColumns = getNumColumns(windowWidth);
  const cardWidth =
    (windowWidth - theme.spacing.lg * 2 - theme.spacing.sm * (numColumns - 1)) /
    numColumns;

  /**
   * Every unacknowledged level is its own celebration, oldest first: a user who
   * jumps two tiers in one sweep sees both, in order, instead of only the last.
   */
  const pending = useMemo<PendingUnlock[]>(() => {
    const badges = query.data ?? [];
    return badges.flatMap((badge) => {
      const unlocks: PendingUnlock[] = [];
      for (let level = badge.seenLevel + 1; level <= badge.currentLevel; level++) {
        unlocks.push({ badge, level });
      }
      return unlocks;
    });
  }, [query.data]);

  const current = pending[cursor] ?? null;

  const dismissCurrent = () => {
    if (!current) return;
    markSeen.mutate({ badgeId: current.badge.id, level: current.level });

    const nextCursor = cursor + 1;
    setCursor(nextCursor);

    // Invalidate ONLY once the queue is drained. Refetching mid-queue would
    // rebuild `pending` from fresher data and drop the celebrations the user
    // has not seen yet.
    if (nextCursor >= pending.length) {
      setCursor(0);
      void queryClient.invalidateQueries({ queryKey: BADGE_QUERY_KEYS.list() });
    }
  };

  return (
    <Screen edges={["top"]}>
      <ScreenHeader title={t("badges.title")} variant="simple" />

      <QueryBoundary
        query={query}
        EmptyComponent={() => (
          <EmptyState
            title={t("badges.empty")}
            subtitle={t("badges.emptySubtitle")}
          />
        )}
      >
        {(badges, { refetch, isFetching }) => (
          <FlatList
            key={numColumns}
            data={badges}
            keyExtractor={(badge) => badge.id}
            numColumns={numColumns}
            columnWrapperStyle={{ gap: theme.spacing.sm }}
            contentContainerStyle={{
              paddingHorizontal: theme.spacing.lg,
              paddingTop: theme.spacing.md,
              paddingBottom: SCREEN_BOTTOM_PADDING,
              gap: theme.spacing.lg,
            }}
            refreshControl={
              <RefreshControl
                refreshing={isFetching}
                onRefresh={refetch}
                tintColor={theme.colors.primary}
              />
            }
            renderItem={({ item }) => (
              <BadgeTile
                badge={item}
                width={cardWidth}
                onPress={() => setSelected(item.id)}
              />
            )}
          />
        )}
      </QueryBoundary>

      <BadgeDetailSheet
        badgeId={selected}
        onClose={() => setSelected(null)}
      />

      {/* The celebration wins over the detail sheet: it is the reason the user
          opened the screen, and it is dismissed in one tap. */}
      {current ? (
        <BadgeUnlockOverlay
          key={`${current.badge.id}-${current.level}`}
          badge={current.badge}
          tierTitle={current.badge.currentTierTitle ?? current.badge.title}
          rarity={current.badge.currentRarity}
          onDismiss={dismissCurrent}
        />
      ) : null}
    </Screen>
  );
}

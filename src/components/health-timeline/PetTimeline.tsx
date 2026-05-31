import { queryClient } from "@/app/_layout";
import { NorboPressable } from "@/components/CustomPressable";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { SCREEN_BOTTOM_PADDING } from "@/constants/layout";
import { useMutation } from "@/hooks/useMutation";
import { petEventsApi } from "@/services/pet-events.api";
import type { PetEvent, PetEventTimeline } from "@/types/pet-event.types";
import { PetEventStatus } from "@/types/pet-event.types";
import { useInfiniteQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, RefreshControl, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { EventItem } from "./EventItem";

interface PetTimelineProps {
  petId: string;
  onScroll?: (event: any) => void;
  /**
   * Top inset applied to the list content (so it starts beneath the
   * collapsing pet-detail header). Also passed to the RefreshControl
   * so the spinner appears below the header.
   */
  contentInsetTop?: number;
}

type ListItem =
  | { kind: "section"; label: string }
  | { kind: "event"; event: PetEvent };

function groupByMonth(events: PetEvent[]): ListItem[] {
  const items: ListItem[] = [];
  let lastKey = "";
  for (const event of events) {
    const raw = event.occurredAt ?? event.scheduledFor;
    const monthKey = raw ? format(parseISO(raw), "MMMM yyyy") : "";
    if (monthKey !== lastKey) {
      items.push({ kind: "section", label: monthKey });
      lastKey = monthKey;
    }
    items.push({ kind: "event", event });
  }
  return items;
}

export function PetTimeline({
  petId,
  onScroll,
  contentInsetTop = 0,
}: PetTimelineProps) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const query = useInfiniteQuery({
    queryKey: ["pet-events", petId],
    queryFn: ({ pageParam }) =>
      petEventsApi
        .list(petId, { cursor: pageParam as string | undefined, limit: 20 })
        .then((r) => r.data),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last: PetEventTimeline) => last.nextCursor ?? undefined,
  });

  const { mutate: completeMutation } = useMutation({
    mutationFn: (eventId: string) => petEventsApi.complete(petId, eventId),
    showSuccessToast: true,
    successMessage: t("petDetail.timeline.completeSuccess"),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["pet-events", petId] });
    },
  });

  const { mutate: cancelMutation } = useMutation({
    mutationFn: (eventId: string) => petEventsApi.cancel(petId, eventId),
    showSuccessToast: true,
    successMessage: t("petDetail.timeline.cancelSuccess"),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["pet-events", petId] });
    },
  });

  const { mutate: deleteMutation } = useMutation({
    mutationFn: (eventId: string) => petEventsApi.delete(petId, eventId),
    showSuccessToast: true,
    successMessage: t("petDetail.timeline.deleteSuccess"),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["pet-events", petId] });
    },
  });

  const allUpcoming = useMemo(
    () => query.data?.pages.flatMap((p) => p.upcoming) ?? [],
    [query.data],
  );

  const allPast = useMemo(
    () => query.data?.pages.flatMap((p) => p.past) ?? [],
    [query.data],
  );

  const listData = useMemo<ListItem[]>(() => {
    const items: ListItem[] = [];

    if (allUpcoming.length > 0) {
      items.push({
        kind: "section",
        label: t("petDetail.timeline.sectionUpcoming"),
      });
      for (const event of allUpcoming) {
        items.push({ kind: "event", event });
      }
    }

    if (allPast.length > 0) {
      items.push({
        kind: "section",
        label: t("petDetail.timeline.sectionPast"),
      });
      items.push(...groupByMonth(allPast));
    }

    return items;
  }, [allUpcoming, allPast, t]);

  const handlePress = useCallback(
    (event: PetEvent) => {
      router.push(`/pets/${petId}/events/${event.id}` as never);
    },
    [petId, router],
  );

  const handleEdit = useCallback(
    (event: PetEvent) => {
      router.push(`/pets/${petId}/events/${event.id}/edit` as never);
    },
    [petId, router],
  );

  const handleComplete = useCallback(
    (event: PetEvent) => completeMutation(event.id),
    [completeMutation],
  );

  const handleCancel = useCallback(
    (event: PetEvent) => cancelMutation(event.id),
    [cancelMutation],
  );

  const handleDelete = useCallback(
    (event: PetEvent) => deleteMutation(event.id),
    [deleteMutation],
  );

  function renderItem({ item }: { item: ListItem }) {
    if (item.kind === "section") {
      return (
        <View style={styles.sectionHeader}>
          <Text
            style={[styles.sectionLabel, { color: theme.colors.textTertiary }]}
          >
            {item.label.toUpperCase()}
          </Text>
        </View>
      );
    }
    const isScheduled = item.event.status === PetEventStatus.SCHEDULED;
    return (
      <EventItem
        event={item.event}
        onPress={handlePress}
        onComplete={isScheduled ? handleComplete : undefined}
        onCancel={isScheduled ? handleCancel : undefined}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    );
  }

  const isEmpty =
    !query.isPending && allUpcoming.length === 0 && allPast.length === 0;

  if (query.isPending) {
    return (
      <View style={[styles.centered, { paddingTop: contentInsetTop }]}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Animated.FlatList
        data={listData}
        keyExtractor={(item, i) =>
          item.kind === "section" ? `section-${item.label}-${i}` : item.event.id
        }
        renderItem={renderItem}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage) {
            void query.fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={() => void query.refetch()}
            progressViewOffset={contentInsetTop}
          />
        }
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop: contentInsetTop,
            paddingBottom: SCREEN_BOTTOM_PADDING + insets.bottom,
          },
          isEmpty && styles.centeredContent,
        ]}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <IconSymbol
              name="calendar"
              size={32}
              tintColor={theme.colors.textTertiary}
            />
            <Text
              style={[styles.emptyText, { color: theme.colors.textTertiary }]}
            >
              {t("petDetail.timeline.empty")}
            </Text>
            <NorboPressable
              style={[styles.addBtn, { backgroundColor: theme.colors.primary }]}
              haptic="medium"
              onPress={() => router.push(`/pets/${petId}/events/new` as never)}
            >
              <Text
                style={[
                  styles.addBtnLabel,
                  { color: theme.colors.textOnPrimary },
                ]}
              >
                {t("petDetail.timeline.addEvent")}
              </Text>
            </NorboPressable>
          </View>
        }
        ListFooterComponent={
          query.isFetchingNextPage ? (
            <View style={styles.footer}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
            </View>
          ) : null
        }
      />

      {/* FAB — only shown when there are events already */}
      {!isEmpty ? (
        <NorboPressable
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          haptic="medium"
          onPress={() => router.push(`/pets/${petId}/events/new` as never)}
        >
          <IconSymbol
            name="plus"
            size={22}
            tintColor={theme.colors.textOnPrimary}
          />
        </NorboPressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 48,
  },
  listContent: {
    flexGrow: 1,
  },
  centeredContent: {
    flex: 1,
    justifyContent: "center",
  },
  sectionHeader: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xs,
  },
  sectionLabel: {
    ...theme.typography.caption,
    fontWeight: "600",
    letterSpacing: 0.6,
  },
  emptyState: {
    alignItems: "center",
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing["3xl"],
    paddingTop: theme.spacing["3xl"],
  },
  emptyText: {
    ...theme.typography.footnote,
    textAlign: "center",
  },
  addBtn: {
    marginTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing["2xl"],
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.pill,
  },
  addBtnLabel: {
    ...theme.typography.subhead,
    fontWeight: "600",
  },
  footer: {
    paddingVertical: theme.spacing.lg,
    alignItems: "center",
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
}));

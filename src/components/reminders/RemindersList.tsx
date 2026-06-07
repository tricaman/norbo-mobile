import { queryClient } from "@/app/_layout";
import { NorboPressable } from "@/components/CustomPressable";
import { ReminderItem } from "@/components/reminders/ReminderItem";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { SCREEN_BOTTOM_PADDING } from "@/constants/layout";
import { useMutation } from "@/hooks/useMutation";
import { remindersApi } from "@/services/reminders.api";
import type {
  Reminder,
  ReminderFilter,
  ReminderListResponse,
} from "@/types/reminder.types";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

interface EmptyStateConfig {
  icon: string;
  title: string;
  subtitle?: string;
  cta?: string;
  onCta?: () => void;
}

function ReminderEmptyState({
  config,
}: {
  config: EmptyStateConfig;
}): React.JSX.Element {
  const { theme } = useUnistyles();
  return (
    <View style={emptyStyles.wrap}>
      <View
        style={[
          emptyStyles.iconWrap,
          { backgroundColor: `${theme.colors.primary}22` },
        ]}
      >
        <IconSymbol
          name={config.icon}
          size={26}
          tintColor={theme.colors.primary}
        />
      </View>
      <Text style={[emptyStyles.title, { color: theme.colors.textPrimary }]}>
        {config.title}
      </Text>
      {config.subtitle !== undefined && (
        <Text
          style={[emptyStyles.subtitle, { color: theme.colors.textSecondary }]}
        >
          {config.subtitle}
        </Text>
      )}
      {config.cta !== undefined && config.onCta !== undefined && (
        <NorboPressable
          style={[emptyStyles.cta, { backgroundColor: theme.colors.primary }]}
          haptic="medium"
          onPress={config.onCta}
        >
          <Text
            style={[
              emptyStyles.ctaLabel,
              { color: theme.colors.textOnPrimary },
            ]}
          >
            {config.cta}
          </Text>
        </NorboPressable>
      )}
    </View>
  );
}

const emptyStyles = StyleSheet.create((theme) => ({
  wrap: {
    alignItems: "center",
    paddingHorizontal: theme.spacing["3xl"],
    paddingTop: theme.spacing["3xl"],
    gap: theme.spacing.sm,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.xs,
  },
  title: {
    ...theme.typography.subhead,
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    ...theme.typography.caption,
    textAlign: "center",
  },
  cta: {
    marginTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing["2xl"],
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.pill,
  },
  ctaLabel: {
    ...theme.typography.subhead,
    fontWeight: "600",
  },
}));

export function RemindersList(): React.JSX.Element {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const router = useRouter();

  const [filter, setFilter] = useState<ReminderFilter>("all");

  const filterOptions: { value: ReminderFilter; label: string }[] = [
    { value: "all", label: t("reminders.filters.all") },
    { value: "upcoming", label: t("reminders.filters.upcoming") },
    { value: "today", label: t("reminders.filters.today") },
    { value: "next7days", label: t("reminders.filters.next7days") },
    { value: "overdue", label: t("reminders.filters.overdue") },
  ];

  const query = useInfiniteQuery({
    queryKey: ["reminders", filter],
    queryFn: ({ pageParam }) =>
      remindersApi
        .list({ filter, cursor: pageParam as string | undefined, limit: 20 })
        .then((r) => r.data),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last: ReminderListResponse) =>
      last.nextCursor ?? undefined,
  });

  const allRows = useMemo(() => {
    const rows = query.data?.pages.flatMap((p) => p.rows) ?? [];
    return [...rows].sort(
      (a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime(),
    );
  }, [query.data]);

  const { mutate: doneMutation } = useMutation({
    mutationFn: (id: string) => remindersApi.complete(id),
    showSuccessToast: true,
    successMessage: t("reminders.toast.done"),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["reminders"] });
    },
  });

  const { mutate: snoozeMutation } = useMutation({
    mutationFn: (id: string) =>
      remindersApi.snooze(
        id,
        new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      ),
    showSuccessToast: true,
    successMessage: t("reminders.toast.snoozed"),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["reminders"] });
    },
  });

  const { mutate: deleteMutation } = useMutation({
    mutationFn: (id: string) => remindersApi.delete(id),
    showSuccessToast: true,
    successMessage: t("reminders.toast.deleted"),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["reminders"] });
    },
  });

  const handlePress = useCallback(
    (reminder: Reminder): void => {
      router.push(`/reminder/${reminder.id}` as never);
    },
    [router],
  );

  const handleDone = useCallback(
    (reminder: Reminder): void => {
      doneMutation(reminder.id);
    },
    [doneMutation],
  );

  const handleSnooze = useCallback(
    (reminder: Reminder): void => {
      snoozeMutation(reminder.id);
    },
    [snoozeMutation],
  );

  const handleEdit = useCallback(
    (reminder: Reminder): void => {
      router.push(`/reminder/${reminder.id}/edit` as never);
    },
    [router],
  );

  const handleDelete = useCallback(
    (reminder: Reminder): void => {
      deleteMutation(reminder.id);
    },
    [deleteMutation],
  );

  const emptyConfig = useMemo((): EmptyStateConfig => {
    switch (filter) {
      case "today":
        return {
          icon: "bell",
          title: t("reminders.empty.today.title"),
          subtitle: t("reminders.empty.today.subtitle"),
        };
      case "next7days":
        return {
          icon: "calendar",
          title: t("reminders.empty.next7days.title"),
          subtitle: t("reminders.empty.next7days.subtitle"),
        };
      case "overdue":
        return {
          icon: "checkmark.circle",
          title: t("reminders.empty.overdue.title"),
          subtitle: t("reminders.empty.overdue.subtitle"),
        };
      case "all":
        return {
          icon: "tray",
          title: t("reminders.empty.all.title"),
          cta: t("reminders.empty.all.cta"),
          onCta: () => {
            router.push("/reminder/new" as never);
          },
        };
      default:
        return {
          icon: "bell",
          title: t("reminders.empty.upcoming.title"),
          subtitle: t("reminders.empty.upcoming.subtitle"),
        };
    }
  }, [filter, t, router]);

  if (query.isPending) {
    return (
      <View style={[styles.root, styles.centered]}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* Filter chips — fixed at top, never scrolls with the list */}
      <View style={styles.filterHeader}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {filterOptions.map((opt) => {
            const isActive = opt.value === filter;
            return (
              <NorboPressable
                key={opt.value}
                scale="row"
                haptic="light"
                onPress={() => {
                  setFilter(opt.value);
                }}
                style={[
                  styles.filterChip,
                  isActive
                    ? {
                        backgroundColor: theme.colors.primary,
                        borderColor: theme.colors.primary,
                      }
                    : {
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.border,
                      },
                ]}
              >
                <Text
                  style={[
                    styles.filterLabel,
                    {
                      color: isActive
                        ? theme.colors.textOnPrimary
                        : theme.colors.textPrimary,
                    },
                  ]}
                >
                  {opt.label}
                </Text>
              </NorboPressable>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={allRows}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ReminderItem
            reminder={item}
            onPress={handlePress}
            onDone={handleDone}
            onSnooze={handleSnooze}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <ReminderEmptyState config={emptyConfig} />
          </View>
        }
        ListFooterComponent={
          query.isFetchingNextPage ? (
            <View style={styles.footer}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
            </View>
          ) : null
        }
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage) {
            void query.fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={() => {
              void query.refetch();
            }}
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <NorboPressable
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        haptic="medium"
        onPress={() => {
          router.push("/reminder/new" as never);
        }}
      >
        <IconSymbol
          name="plus"
          size={22}
          tintColor={theme.colors.textOnPrimary}
        />
      </NorboPressable>
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
  },
  filterHeader: {
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
  },
  filterRow: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing["3xl"],
    gap: theme.spacing.sm,
  },
  filterChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.pill,
    borderWidth: theme.hairline,
  },
  filterLabel: {
    ...theme.typography.subhead,
    fontWeight: "600",
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: SCREEN_BOTTOM_PADDING,
    paddingTop: theme.spacing.xs,
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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

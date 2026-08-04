import { NotificationRow } from "@/components/notifications/NotificationRow";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListSeparator } from "@/components/ui/ListSeparator";
import { SCREEN_BOTTOM_PADDING } from "@/constants/layout";
import {
  useMarkNotificationRead,
  useNotificationsList,
} from "@/hooks/useNotificationsInbox";
import { getNavTargetFromData } from "@/services/notifications";
import type { InboxNotification } from "@/types/notifications.types";
import { useFocusEffect, useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, FlatList, RefreshControl, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

/**
 * Body of the notifications inbox. Split out of the screen so the tab route
 * stays a thin shell, mirroring how `RemindersList` relates to its screen.
 *
 * Tapping a row marks it read and follows the same `getNavTargetFromData`
 * routing table the OS push tap uses, so an inbox tap lands exactly where
 * tapping the original notification would have.
 */
export function NotificationsList(): React.JSX.Element {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const router = useRouter();

  const query = useNotificationsList();
  const notifications = query.data ?? [];
  const markRead = useMarkNotificationRead();

  // Tab screens stay mounted after their first visit, so `refetchOnMount` fires
  // only once per session: without this the list would go stale the moment the
  // polled bell badge (see `useNotificationsUnreadCount`) announced something
  // the list can't show yet. `refetch` is stable, so this runs once per focus.
  const refetch = query.refetch;
  useFocusEffect(
    React.useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  const handlePress = (item: InboxNotification) => {
    if (!item.readAt) markRead.mutate(item.id);
    const route = getNavTargetFromData(item.data ?? undefined);
    if (route) router.push(route as never);
  };

  return (
    <FlatList<InboxNotification>
      data={notifications}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <NotificationRow item={item} onPress={() => handlePress(item)} />
      )}
      ItemSeparatorComponent={ListSeparator}
      ListEmptyComponent={
        query.isPending ? (
          <View style={styles.centered}>
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        ) : (
          <EmptyState
            title={t("notificationsInbox.empty")}
            subtitle={t("notificationsInbox.emptySubtitle")}
          />
        )
      }
      refreshControl={
        <RefreshControl
          refreshing={query.isRefetching}
          onRefresh={() => {
            void query.refetch();
          }}
          tintColor={theme.colors.primary}
        />
      }
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create((theme) => ({
  listContent: {
    flexGrow: 1,
    paddingTop: theme.spacing.sm,
    paddingBottom: SCREEN_BOTTOM_PADDING,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 48,
  },
}));

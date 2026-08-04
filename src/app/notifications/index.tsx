import { NotificationRow } from "@/components/notifications/NotificationRow";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListSeparator } from "@/components/ui/ListSeparator";
import { Screen } from "@/components/ui/Screen";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { SCREEN_BOTTOM_PADDING } from "@/constants/layout";
import {
  useMarkNotificationRead,
  useNotificationsList,
} from "@/hooks/useNotificationsInbox";
import { getNavTargetFromData } from "@/services/notifications";
import type { InboxNotification } from "@/types/notifications.types";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, FlatList, RefreshControl, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

export default function NotificationsListScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const query = useNotificationsList();
  const notifications = query.data ?? [];
  const markRead = useMarkNotificationRead();

  const handlePress = (item: InboxNotification) => {
    if (!item.readAt) markRead.mutate(item.id);
    const route = getNavTargetFromData(item.data ?? undefined);
    if (route) router.push(route as never);
  };

  return (
    <Screen>
      <ScreenHeader title={t("notificationsInbox.title")} />
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
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: SCREEN_BOTTOM_PADDING + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  listContent: { flexGrow: 1, paddingTop: theme.spacing.sm },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 48,
  },
}));

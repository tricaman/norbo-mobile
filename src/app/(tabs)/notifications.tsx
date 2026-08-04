import { NorboPressable } from "@/components/CustomPressable";
import { NotificationsList } from "@/components/notifications/NotificationsList";
import { TabScreen } from "@/components/ui/TabScreen";
import {
  useMarkAllNotificationsRead,
  useNotificationsUnreadCount,
} from "@/hooks/useNotificationsInbox";
import React from "react";
import { useTranslation } from "react-i18next";
import { Text } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

export default function NotificationsTab(): React.JSX.Element {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const unread = useNotificationsUnreadCount().data ?? 0;
  const markAllRead = useMarkAllNotificationsRead();

  return (
    <TabScreen
      title={t("notificationsInbox.title")}
      edges={["top"]}
      right={
        unread > 0 ? (
          <NorboPressable
            scale="row"
            haptic="light"
            onPress={() => markAllRead.mutate()}
          >
            <Text style={[styles.action, { color: theme.colors.primary }]}>
              {t("notificationsInbox.markAllRead")}
            </Text>
          </NorboPressable>
        ) : undefined
      }
    >
      <NotificationsList />
    </TabScreen>
  );
}

const styles = StyleSheet.create((theme) => ({
  action: { ...theme.typography.footnote, fontWeight: "600" },
}));

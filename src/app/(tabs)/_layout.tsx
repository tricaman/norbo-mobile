import { FloatingTabBar } from "@/components/navigation/FloatingTabBar";
import { useNotificationsUnreadCount } from "@/hooks/useNotificationsInbox";
import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";

export default function TabsLayout() {
  const { t } = useTranslation();
  // Drives the bell badge. Safe here: `(tabs)` only mounts once authed, and
  // QueryClientProvider wraps the whole stack.
  const unread = useNotificationsUnreadCount().data ?? 0;

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("tabs.home"),
          tabBarLabel: t("tabs.home"),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: t("tabs.notifications"),
          tabBarLabel: t("tabs.notifications"),
          tabBarBadge: unread > 0 ? unread : undefined,
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: t("tabs.services"),
          tabBarLabel: t("tabs.services"),
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: t("tabs.expenses"),
          tabBarLabel: t("tabs.expenses"),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("tabs.profile"),
          tabBarLabel: t("tabs.profile"),
        }}
      />
    </Tabs>
  );
}

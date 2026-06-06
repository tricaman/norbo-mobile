import { FloatingTabBar } from "@/components/navigation/FloatingTabBar";
import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";

export default function TabsLayout() {
  const { t } = useTranslation();

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
        name="reminders"
        options={{
          title: t("tabs.reminders"),
          tabBarLabel: t("tabs.reminders"),
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

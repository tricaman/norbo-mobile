import { NorboPressable } from "@/components/CustomPressable";
import { PageTitle } from "@/components/ui/PageTitle";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useNotificationsUnreadCount } from "@/hooks/useNotificationsInbox";
import { petEventsApi } from "@/services/pet-events.api";
import { useAuthStore } from "@/stores/auth.store";
import { useQuery } from "@tanstack/react-query";
import { isToday, parseISO } from "date-fns";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

interface HomeGreetingProps {
  onPressAdd: () => void;
}

/**
 * HomeGreeting — top section of the home tab.
 *
 * Shows a personalised greeting ("Ciao, {name}") and a one-line summary
 * derived from the user's upcoming events feed: number of events
 * scheduled for today, or a calm "all under control" copy when there
 * are none. The trailing slot hosts the "add pet" pill button.
 */
export function HomeGreeting({ onPressAdd }: HomeGreetingProps) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const unread = useNotificationsUnreadCount().data ?? 0;

  const query = useQuery({
    queryKey: ["upcoming-events"],
    queryFn: () => petEventsApi.listUpcoming({ limit: 5 }).then((r) => r.data),
  });

  const events = query.data ?? [];
  const todayCount = events.filter((e) => {
    if (!e.scheduledFor) return false;
    return isToday(parseISO(e.scheduledFor));
  }).length;

  const firstName = user?.name?.trim().split(/\s+/)[0] ?? null;
  const greeting = firstName
    ? t("homeGreeting.helloWithName", { name: firstName })
    : t("homeGreeting.helloFallback");

  const todayLabel =
    todayCount === 0
      ? null
      : todayCount === 1
        ? t("homeGreeting.todayOne")
        : t("homeGreeting.todayMany", { count: todayCount });

  const allClear = t("homeGreeting.allClear");
  const subtitle = todayLabel ? `${todayLabel} · ${allClear}` : allClear;

  return (
    <PageTitle
      title={greeting}
      subtitle={subtitle}
      right={
        <View style={styles.actions}>
          <NorboPressable
            style={[styles.iconBtn, { backgroundColor: theme.colors.surface2 }]}
            scale="row"
            haptic="light"
            onPress={() => router.push("/notifications")}
          >
            <IconSymbol
              name={unread > 0 ? "bell.fill" : "bell"}
              size={18}
              tintColor={theme.colors.textPrimary}
            />
            {unread > 0 ? (
              <View
                style={[styles.badge, { backgroundColor: theme.colors.primary }]}
              >
                <Text
                  style={[styles.badgeText, { color: theme.colors.textOnPrimary }]}
                  numberOfLines={1}
                >
                  {unread}
                </Text>
              </View>
            ) : null}
          </NorboPressable>
          <NorboPressable
            style={[styles.addBtn, { backgroundColor: theme.colors.primary }]}
            scale="row"
            haptic="medium"
            onPress={onPressAdd}
          >
            <IconSymbol
              name="plus"
              size={18}
              tintColor={theme.colors.textOnPrimary}
            />
          </NorboPressable>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create((theme) => ({
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: 2,
    right: 2,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 4,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "700",
  },
}));

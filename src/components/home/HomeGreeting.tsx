import { UpdateHeaderButton } from "@/components/app/UpdateHeaderButton";
import { NorboPressable } from "@/components/CustomPressable";
import { PageTitle } from "@/components/ui/PageTitle";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { remindersApi } from "@/services/reminders.api";
import { useAuthStore } from "@/stores/auth.store";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
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
  const user = useAuthStore((s) => s.user);

  // Counts reminders, not pet events, so the subtitle agrees with the
  // reminders section rendered right below it. The `["reminders", …]` key
  // prefix means every existing reminder mutation already invalidates this.
  const query = useQuery({
    queryKey: ["reminders", { filter: "today" as const }],
    queryFn: () =>
      remindersApi.list({ filter: "today", limit: 50 }).then((r) => r.data),
  });

  const todayCount = query.data?.rows.length ?? 0;

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
        // The home tab renders its own header, so the update icon (silent
        // unless an update is available — see `UpdateGate`) is mounted here
        // too, next to "add pet", to match every other tab root.
        <View style={styles.actions}>
          <UpdateHeaderButton />
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
}));

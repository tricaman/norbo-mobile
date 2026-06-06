import { Description } from "@/components/ui/Description";
import { Screen } from "@/components/ui/Screen";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { SettingsCard, SettingsRow } from "@/components/ui/SettingsRow";
import { useMutation } from "@/hooks/useMutation";
import { usersApi } from "@/services/users.api";
import { useAuthStore } from "@/stores/auth.store";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  type NotificationPreferences,
  type QuietHours,
} from "@/types/preferences.schema";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, Switch, Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

const DEFAULT_QUIET_HOURS: QuietHours = { start: "22:00", end: "07:00" };

/**
 * Notifications preferences — Identity & Access scaffold.
 *
 * The actual scheduling/delivery infra ships with the Reminder bounded
 * context (Phase 5). For now this screen only persists user intent via
 * `PATCH /auth/me/preferences` and shows a disclaimer making the gap
 * explicit.
 *
 * Quiet-hours editor is intentionally minimal: a single toggle that
 * commits a default 22:00–07:00 range. A proper time-picker UI is on
 * the backlog (requires `@react-native-community/datetimepicker`).
 */
export default function NotificationsScreen() {
  const { theme } = useUnistyles();
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const initial: NotificationPreferences =
    user?.notificationPreferences ?? DEFAULT_NOTIFICATION_PREFERENCES;
  const [prefs, setPrefs] = useState<NotificationPreferences>(initial);

  const { mutate } = useMutation({
    mutationFn: (next: NotificationPreferences) =>
      usersApi.updatePreferences({ notificationPreferences: next }),
    showErrorToast: true,
    errorMessage: t("notifications.saveError"),
    triggerHaptics: false,
    onSuccess: (res) => {
      setUser(res.data);
    },
  });

  const persist = (next: NotificationPreferences): void => {
    setPrefs(next);
    mutate(next);
  };

  return (
    <Screen>
      <ScreenHeader title={t("notifications.title")} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <SettingsCard
          dividerInset={theme.spacing.xl}
          title={t("notifications.sectionLabel")}
        >
          <SettingsRow
            iconName="cross.case"
            label={t("notifications.healthReminders")}
            subtitle={t("notifications.healthRemindersSubtitle")}
            right={
              <Switch
                value={prefs.healthReminders}
                onValueChange={(v) => persist({ ...prefs, healthReminders: v })}
                trackColor={{
                  false: theme.colors.border,
                  true: theme.colors.primary,
                }}
              />
            }
          />
          <SettingsRow
            iconName="bag"
            label={t("notifications.maintenanceReminders")}
            subtitle={t("notifications.maintenanceRemindersSubtitle")}
            right={
              <Switch
                value={prefs.maintenanceReminders}
                onValueChange={(v) =>
                  persist({ ...prefs, maintenanceReminders: v })
                }
                trackColor={{
                  false: theme.colors.border,
                  true: theme.colors.primary,
                }}
              />
            }
          />
        </SettingsCard>

        <SettingsCard
          dividerInset={theme.spacing.xl}
          title={t("notifications.quietHoursSection")}
        >
          <SettingsRow
            iconName="moon"
            label={t("notifications.quietHoursEnable")}
            subtitle={
              prefs.quietHours
                ? `${prefs.quietHours.start} → ${prefs.quietHours.end}`
                : undefined
            }
            right={
              <Switch
                value={!!prefs.quietHours}
                onValueChange={(v) =>
                  persist({
                    ...prefs,
                    quietHours: v ? DEFAULT_QUIET_HOURS : null,
                  })
                }
                trackColor={{
                  false: theme.colors.border,
                  true: theme.colors.primary,
                }}
              />
            }
          />
        </SettingsCard>

        <View style={styles.disclaimerCard}>
          <Text style={styles.disclaimerText}>
            {t("notifications.disclaimer")}
          </Text>
        </View>

        <Description>{t("common.comingSoon")}</Description>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  scrollContent: {
    paddingHorizontal: theme.spacing["3xl"],
    paddingTop: theme.spacing["2xl"],
    paddingBottom: theme.spacing["3xl"],
    gap: theme.spacing.lg,
  },
  disclaimerCard: {
    backgroundColor: theme.colors.warningSoft,
    padding: theme.spacing.lg,
    ...theme.card,
  },
  disclaimerText: {
    ...theme.typography.footnote,
    color: theme.colors.textPrimary,
    lineHeight: 20,
  },
}));

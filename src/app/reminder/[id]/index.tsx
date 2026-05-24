import { queryClient } from "@/app/_layout";
import { NorboPressable } from "@/components/CustomPressable";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { QueryBoundary } from "@/components/ui/QueryBoundary";
import { Screen } from "@/components/ui/Screen";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { SCREEN_BOTTOM_PADDING } from "@/constants/layout";
import { useMutation } from "@/hooks/useMutation";
import { remindersApi } from "@/services/reminders.api";
import type { Reminder } from "@/types/reminder.types";
import { ReminderStatus } from "@/types/reminder.types";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { enUS, it as itLocale } from "date-fns/locale";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

export default function ReminderDetailScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();

  const query = useQuery({
    queryKey: ["reminders", "detail", id],
    queryFn: () => remindersApi.get(id).then((r) => r.data),
    enabled: !!id,
  });

  return (
    <Screen>
      <QueryBoundary query={query}>
        {(reminder) => <ReminderDetail reminder={reminder} />}
      </QueryBoundary>
    </Screen>
  );
}

function ReminderDetail({ reminder }: { reminder: Reminder }): React.JSX.Element {
  const { t, i18n } = useTranslation();
  const { theme } = useUnistyles();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dateLocale = i18n.language.startsWith("it") ? itLocale : enUS;

  const canTransition =
    reminder.status === ReminderStatus.PENDING ||
    reminder.status === ReminderStatus.SNOOZED;

  const { mutate: completeMutation, isPending: isCompleting } = useMutation({
    mutationFn: () => remindersApi.complete(reminder.id),
    showSuccessToast: true,
    successMessage: t("reminders.toast.done"),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["reminders"] });
      void queryClient.invalidateQueries({
        queryKey: ["reminders", "detail", reminder.id],
      });
      router.back();
    },
  });

  const { mutate: snoozeMutation, isPending: isSnoozing } = useMutation({
    mutationFn: (until: string) => remindersApi.snooze(reminder.id, until),
    showSuccessToast: true,
    successMessage: t("reminders.toast.snoozed"),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["reminders"] });
      void queryClient.invalidateQueries({
        queryKey: ["reminders", "detail", reminder.id],
      });
    },
  });

  const { mutate: deleteMutation, isPending: isDeleting } = useMutation({
    mutationFn: () => remindersApi.delete(reminder.id),
    showSuccessToast: true,
    successMessage: t("reminders.toast.deleted"),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["reminders"] });
      router.back();
    },
  });

  function snoozeFor(ms: number): void {
    snoozeMutation(new Date(Date.now() + ms).toISOString());
  }

  function showSnoozePicker(): void {
    Alert.alert(
      t("reminderDetail.snoozeTitle"),
      undefined,
      [
        {
          text: t("reminderDetail.snooze1h"),
          onPress: () => { snoozeFor(60 * 60 * 1000); },
        },
        {
          text: t("reminderDetail.snooze3h"),
          onPress: () => { snoozeFor(3 * 60 * 60 * 1000); },
        },
        {
          text: t("reminderDetail.snooze24h"),
          onPress: () => { snoozeFor(24 * 60 * 60 * 1000); },
        },
        {
          text: t("reminderDetail.snooze3d"),
          onPress: () => { snoozeFor(3 * 24 * 60 * 60 * 1000); },
        },
        {
          text: t("reminderDetail.snooze1w"),
          onPress: () => { snoozeFor(7 * 24 * 60 * 60 * 1000); },
        },
        { text: t("common.cancel"), style: "cancel" },
      ],
    );
  }

  function confirmDelete(): void {
    Alert.alert(
      t("reminders.deleteConfirmTitle"),
      t("reminders.deleteConfirmMessage"),
      [
        { text: t("reminders.deleteConfirmCancel"), style: "cancel" },
        {
          text: t("reminders.deleteConfirmOk"),
          style: "destructive",
          onPress: () => { deleteMutation(); },
        },
      ],
    );
  }

  const dueLabel = format(parseISO(reminder.dueAt), "PPP", { locale: dateLocale });
  const subjectLabel = t(
    `reminders.subject.${reminder.subjectType}` as "reminders.subject.HEALTH_EVENT",
  );
  const statusLabel = t(
    `reminderDetail.status.${reminder.status}` as "reminderDetail.status.PENDING",
  );

  const statusColor =
    reminder.status === ReminderStatus.DONE
      ? theme.colors.primary
      : reminder.status === ReminderStatus.CANCELLED
        ? theme.colors.textTertiary
        : reminder.status === ReminderStatus.SNOOZED
          ? theme.colors.warning
          : theme.colors.textPrimary;

  const isWorking = isCompleting || isSnoozing || isDeleting;

  return (
    <>
      <ScreenHeader
        title={t("reminders.title")}
        right={
          <NorboPressable
            haptic="light"
            onPress={() => {
              router.push(`/reminder/${reminder.id}/edit` as never);
            }}
          >
            <IconSymbol
              name="pencil"
              size={18}
              tintColor={theme.colors.primary}
            />
          </NorboPressable>
        }
      />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: SCREEN_BOTTOM_PADDING + insets.bottom },
        ]}
      >
        {/* Main info card */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text style={[styles.fieldLabel, { color: theme.colors.textTertiary }]}>
            {t("reminderForm.details").toUpperCase()}
          </Text>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
            {reminder.title}
          </Text>
          {reminder.description ? (
            <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
              {reminder.description}
            </Text>
          ) : null}
        </View>

        {/* Meta card */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View style={styles.metaRow}>
            <Text style={[styles.fieldLabel, { color: theme.colors.textTertiary }]}>
              {t("reminderDetail.due").toUpperCase()}
            </Text>
            <Text style={[styles.metaValue, { color: theme.colors.textPrimary }]}>
              {dueLabel}
            </Text>
          </View>

          <View style={styles.separator} />

          <View style={styles.metaRow}>
            <Text style={[styles.fieldLabel, { color: theme.colors.textTertiary }]}>
              {t("reminderDetail.subjectLabel").toUpperCase()}
            </Text>
            <View style={[styles.badge, { backgroundColor: `${theme.colors.primary}22` }]}>
              <Text style={[styles.badgeText, { color: theme.colors.primary }]}>
                {subjectLabel}
              </Text>
            </View>
          </View>

          <View style={styles.separator} />

          <View style={styles.metaRow}>
            <Text style={[styles.fieldLabel, { color: theme.colors.textTertiary }]}>
              {t("reminderDetail.statusLabel").toUpperCase()}
            </Text>
            <Text style={[styles.metaValue, { color: statusColor }]}>
              {statusLabel}
            </Text>
          </View>

          {reminder.snoozedUntil ? (
            <>
              <View style={styles.separator} />
              <View style={styles.metaRow}>
                <Text style={[styles.metaNote, { color: theme.colors.textSecondary }]}>
                  {t("reminderDetail.snoozedUntil", {
                    date: format(parseISO(reminder.snoozedUntil), "PPP", { locale: dateLocale }),
                  })}
                </Text>
              </View>
            </>
          ) : null}

          {reminder.completedAt ? (
            <>
              <View style={styles.separator} />
              <View style={styles.metaRow}>
                <Text style={[styles.metaNote, { color: theme.colors.textSecondary }]}>
                  {t("reminderDetail.completedAt", {
                    date: format(parseISO(reminder.completedAt), "PPP", { locale: dateLocale }),
                  })}
                </Text>
              </View>
            </>
          ) : null}
        </View>

        {/* Actions */}
        {canTransition && (
          <View style={styles.actions}>
            <NorboPressable
              style={[styles.actionBtn, { backgroundColor: theme.colors.primary }]}
              haptic="success"
              disabled={isWorking}
              onPress={() => { completeMutation(); }}
            >
              <IconSymbol
                name="checkmark.circle.fill"
                size={20}
                tintColor={theme.colors.textOnPrimary}
              />
              <Text style={[styles.actionLabel, { color: theme.colors.textOnPrimary }]}>
                {t("reminderDetail.actionComplete")}
              </Text>
            </NorboPressable>

            <NorboPressable
              style={[styles.actionBtn, { backgroundColor: theme.colors.warning }]}
              haptic="warning"
              disabled={isWorking}
              onPress={showSnoozePicker}
            >
              <IconSymbol
                name="moon.zzz.fill"
                size={18}
                tintColor={theme.colors.textOnPrimary}
              />
              <Text style={[styles.actionLabel, { color: theme.colors.textOnPrimary }]}>
                {t("reminderDetail.actionSnooze")}
              </Text>
            </NorboPressable>
          </View>
        )}

        <View style={[styles.actions, !canTransition && styles.actionsTopMargin]}>
          <NorboPressable
            style={[styles.actionBtn, { backgroundColor: theme.colors.error }]}
            haptic="error"
            disabled={isWorking}
            onPress={confirmDelete}
          >
            <IconSymbol
              name="trash.fill"
              size={18}
              tintColor={theme.colors.textOnPrimary}
            />
            <Text style={[styles.actionLabel, { color: theme.colors.textOnPrimary }]}>
              {t("reminderDetail.actionDelete")}
            </Text>
          </NorboPressable>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create((theme) => ({
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    flexGrow: 1,
  },
  card: {
    borderRadius: theme.radius.lg,
    borderWidth: theme.hairline,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  fieldLabel: {
    ...theme.typography.caption,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  title: {
    ...theme.typography.title2,
    fontWeight: "700",
  },
  description: {
    ...theme.typography.body,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 28,
  },
  metaValue: {
    ...theme.typography.subhead,
    fontWeight: "500",
  },
  metaNote: {
    ...theme.typography.caption,
    flex: 1,
  },
  separator: {
    height: theme.hairline,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.xs,
  },
  badge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.radius.pill,
  },
  badgeText: {
    ...theme.typography.caption,
    fontWeight: "600",
  },
  actions: {
    gap: theme.spacing.sm,
  },
  actionsTopMargin: {
    marginTop: theme.spacing.lg,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.pill,
  },
  actionLabel: {
    ...theme.typography.subhead,
    fontWeight: "600",
  },
}));

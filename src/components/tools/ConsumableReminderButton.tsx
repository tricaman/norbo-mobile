import { NorboPressable } from "@/components/CustomPressable";
import { useMutation } from "@/hooks/useMutation";
import { remindersApi } from "@/services/reminders.api";
import { ReminderSubjectType } from "@/types/reminder.types";
import React from "react";
import { useTranslation } from "react-i18next";
import { Text } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

/**
 * ConsumableReminderButton — shared "set reorder reminder" CTA that creates a
 * CONSUMABLE reminder via the existing Reminder Engine API (remindersApi.create).
 * No new reminder logic; reused by every supply/consumption tool so the
 * integration lives in one place.
 */
export function ConsumableReminderButton({
  petId,
  title,
  dueAt,
}: {
  petId: string;
  title: string;
  dueAt: Date;
}): React.JSX.Element {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const { mutate, isPending, isSuccess } = useMutation({
    mutationFn: () =>
      remindersApi
        .create({
          subjectType: ReminderSubjectType.CONSUMABLE,
          petId,
          title,
          dueAt: dueAt.toISOString(),
        })
        .then((r) => r.data),
    showSuccessToast: true,
    successMessage: t("tools.reminder.created"),
  });

  return (
    <NorboPressable
      scale="row"
      haptic="medium"
      disabled={isPending || isSuccess}
      onPress={() => mutate()}
      style={[styles.button, { borderColor: theme.colors.primary }]}
    >
      <Text style={[styles.label, { color: theme.colors.primary }]}>
        {isSuccess ? t("tools.reminder.created") : t("tools.reminder.create")}
      </Text>
    </NorboPressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  button: {
    alignItems: "center",
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.pill,
    borderWidth: theme.hairline,
  },
  label: {
    ...theme.typography.subhead,
    fontFamily: theme.fonts.monoMd,
  },
}));

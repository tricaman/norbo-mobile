import { NorboPressable } from "@/components/CustomPressable";
import { ChipSelector, type ChipOption } from "@/components/ui/ChipSelector";
import { IconSymbol } from "@/components/ui/IconSymbol";
import {
  SingleSelectSheet,
  type SingleSelectOption,
} from "@/components/ui/SingleSelectSheet";
import { DateField } from "@/components/ui/DateField";
import { FormCard } from "@/components/ui/FormCard";
import { FormInput } from "@/components/ui/FormInput";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { SCREEN_BOTTOM_PADDING } from "@/constants/layout";
import { ReminderSubjectType } from "@/types/reminder.types";
import React, { useMemo } from "react";
import {
  Controller,
  FormProvider,
  useWatch,
  type UseFormReturn,
} from "react-hook-form";
import { useTranslation } from "react-i18next";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { z } from "zod";

export const reminderFormSchema = z.object({
  subjectType: z.nativeEnum(ReminderSubjectType),
  dueAt: z.date(),
  title: z.string().min(1, "required").max(120),
  description: z.string().max(2000).nullable().optional(),
  // "NONE" = one-shot; mapped to recurrence null/{freq} in the screens.
  repeat: z.enum(["NONE", "MONTHLY", "YEARLY"]),
  // Only meaningful when repeat === "MONTHLY" (e.g. antiparassitario every
  // 3 months); ignored otherwise. Range mirrors the server's
  // reminderRecurrenceSchema (1-24).
  intervalMonths: z.number().int().min(1).max(24),
});

export type ReminderFormValues = z.infer<typeof reminderFormSchema>;

interface ReminderFormProps {
  form: UseFormReturn<ReminderFormValues>;
  isSubmitting: boolean;
  submitLabel: string;
  onSubmit: (values: ReminderFormValues) => void;
  disableSubjectTypeChange?: boolean;
  /**
   * Hidden for event-linked reminders (subjectRef != null): the API
   * rejects recurrence on those — the event flow owns their lifecycle.
   */
  showRepeat?: boolean;
}

export function ReminderForm({
  form,
  isSubmitting,
  submitLabel,
  onSubmit,
  disableSubjectTypeChange = false,
  showRepeat = true,
}: ReminderFormProps): React.JSX.Element {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const insets = useSafeAreaInsets();

  const repeat = useWatch({ control: form.control, name: "repeat" });
  const intervalMonths = useWatch({
    control: form.control,
    name: "intervalMonths",
  });

  const subjectTypeEntries: Array<{ value: ReminderSubjectType; i18n: string; icon: string }> = [
    { value: ReminderSubjectType.HEALTH_EVENT, i18n: "HEALTH_EVENT", icon: "bell.fill" },
    { value: ReminderSubjectType.MAINTENANCE, i18n: "MAINTENANCE", icon: "wrench" },
    { value: ReminderSubjectType.CONSUMABLE, i18n: "CONSUMABLE", icon: "cart.fill" },
    { value: ReminderSubjectType.ADMIN, i18n: "ADMIN", icon: "doc.text" },
    { value: ReminderSubjectType.MILESTONE, i18n: "MILESTONE", icon: "flag.fill" },
    { value: ReminderSubjectType.CUSTOM, i18n: "CUSTOM", icon: "note.text" },
  ];

  const subjectTypeOptions = useMemo<SingleSelectOption<ReminderSubjectType>[]>(
    () =>
      subjectTypeEntries.map((e) => ({
        value: e.value,
        label: t(`reminders.subject.${e.i18n}` as "reminders.subject.HEALTH_EVENT"),
        leading: () => (
          <IconSymbol name={e.icon} size={18} tintColor={theme.colors.textSecondary} />
        ),
      })),
    [t, theme],
  );

  const repeatOptions = useMemo<ChipOption<ReminderFormValues["repeat"]>[]>(
    () => [
      { value: "NONE", label: t("reminderForm.repeat_NONE") },
      { value: "MONTHLY", label: t("reminderForm.repeat_MONTHLY") },
      { value: "YEARLY", label: t("reminderForm.repeat_YEARLY") },
    ],
    [t],
  );

  const handleSubmit = form.handleSubmit(onSubmit);

  return (
    <FormProvider {...form}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: SCREEN_BOTTOM_PADDING + insets.bottom + 80 },
        ]}
      >
        {!disableSubjectTypeChange && (
          <>
            <SectionLabel style={styles.sectionLabel}>
              {t("reminderForm.subjectType")}
            </SectionLabel>
            <Controller
              control={form.control}
              name="subjectType"
              render={({ field }) => (
                <SingleSelectSheet
                  options={subjectTypeOptions}
                  value={field.value}
                  onChange={(v) => {
                    field.onChange(v);
                  }}
                  title={t("reminderForm.subjectType")}
                />
              )}
            />
          </>
        )}

        <SectionLabel style={styles.sectionLabel}>
          {t("reminderForm.dueAt")}
        </SectionLabel>
        <FormCard style={styles.card}>
          <Controller
            control={form.control}
            name="dueAt"
            render={({ field }) => (
              <DateField
                value={field.value instanceof Date ? field.value : null}
                onChange={field.onChange}
                minimumDate={new Date()}
                placeholder={t("common.tapToSet") as string}
              />
            )}
          />
        </FormCard>

        {/* Recurrence — for recurring treatments (antipulci, filaria,
            richiami annuali). Completing a recurring reminder makes the
            API spawn the next occurrence automatically. */}
        {showRepeat ? (
          <>
            <SectionLabel style={styles.sectionLabel}>
              {t("reminderForm.repeat")}
            </SectionLabel>
            <Controller
              control={form.control}
              name="repeat"
              render={({ field }) => (
                <ChipSelector
                  options={repeatOptions}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />

            {/* Month-interval stepper — only for MONTHLY (antipulci ogni 2/3/4
                mesi, filaria, ecc.). YEARLY has no interval control in v1. */}
            {repeat === "MONTHLY" ? (
              <FormCard style={styles.card}>
                <View style={styles.stepperRow}>
                  <NorboPressable
                    haptic="light"
                    disabled={intervalMonths <= 1}
                    onPress={() => {
                      form.setValue(
                        "intervalMonths",
                        Math.max(1, intervalMonths - 1),
                        { shouldDirty: true },
                      );
                    }}
                  >
                    <IconSymbol
                      name="minus.circle.fill"
                      size={26}
                      tintColor={
                        intervalMonths <= 1
                          ? theme.colors.textTertiary
                          : theme.colors.primary
                      }
                    />
                  </NorboPressable>
                  <Text
                    style={[
                      styles.stepperLabel,
                      { color: theme.colors.textPrimary },
                    ]}
                  >
                    {t("reminderForm.everyNMonths", { count: intervalMonths })}
                  </Text>
                  <NorboPressable
                    haptic="light"
                    disabled={intervalMonths >= 24}
                    onPress={() => {
                      form.setValue(
                        "intervalMonths",
                        Math.min(24, intervalMonths + 1),
                        { shouldDirty: true },
                      );
                    }}
                  >
                    <IconSymbol
                      name="plus.circle.fill"
                      size={26}
                      tintColor={
                        intervalMonths >= 24
                          ? theme.colors.textTertiary
                          : theme.colors.primary
                      }
                    />
                  </NorboPressable>
                </View>
              </FormCard>
            ) : null}
          </>
        ) : null}

        <SectionLabel style={styles.sectionLabel}>
          {t("reminderForm.details")}
        </SectionLabel>
        <FormCard dividedChildren style={styles.card}>
          <FormInput
            name="title"
            placeholder={t("reminderForm.titlePlaceholder")}
            returnKeyType="next"
          />
          <FormInput
            name="description"
            placeholder={t("reminderForm.descriptionPlaceholder")}
            multiline
            numberOfLines={3}
            returnKeyType="done"
          />
        </FormCard>

        <NorboPressable
          style={[
            styles.submitBtn,
            {
              backgroundColor: isSubmitting
                ? theme.colors.border
                : theme.colors.primary,
            },
          ]}
          haptic="medium"
          disabled={isSubmitting}
          onPress={() => {
            void handleSubmit();
          }}
        >
          <Text
            style={[styles.submitLabel, { color: theme.colors.textOnPrimary }]}
          >
            {submitLabel}
          </Text>
        </NorboPressable>
      </ScrollView>
    </FormProvider>
  );
}

const styles = StyleSheet.create((theme) => ({
  scroll: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
  sectionLabel: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xs,
  },
  card: {
    marginBottom: 0,
  },
  submitBtn: {
    marginTop: theme.spacing["2xl"],
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.pill,
    alignItems: "center",
  },
  submitLabel: {
    ...theme.typography.subhead,
    fontWeight: "700",
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.lg,
    paddingVertical: theme.spacing.xs,
  },
  stepperLabel: {
    ...theme.typography.subhead,
    fontWeight: "600",
    minWidth: 110,
    textAlign: "center",
  },
}));

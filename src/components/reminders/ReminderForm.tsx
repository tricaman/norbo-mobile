import { NorboPressable } from "@/components/CustomPressable";
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
import { Controller, FormProvider, type UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { ScrollView, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { z } from "zod";

export const reminderFormSchema = z.object({
  subjectType: z.nativeEnum(ReminderSubjectType),
  dueAt: z.date(),
  title: z.string().min(1, "required").max(120),
  description: z.string().max(2000).nullable().optional(),
});

export type ReminderFormValues = z.infer<typeof reminderFormSchema>;

interface ReminderFormProps {
  form: UseFormReturn<ReminderFormValues>;
  isSubmitting: boolean;
  submitLabel: string;
  onSubmit: (values: ReminderFormValues) => void;
  disableSubjectTypeChange?: boolean;
}

export function ReminderForm({
  form,
  isSubmitting,
  submitLabel,
  onSubmit,
  disableSubjectTypeChange = false,
}: ReminderFormProps): React.JSX.Element {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const insets = useSafeAreaInsets();

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
}));

import { NorboPressable } from "@/components/CustomPressable";
import {
  AttachmentSection,
  MAX_ATTACHMENTS,
} from "@/components/media/AttachmentSection";
import { ChipSelector, type ChipOption } from "@/components/ui/ChipSelector";
import { DateField } from "@/components/ui/DateField";
import { FormCard } from "@/components/ui/FormCard";
import { FormInput } from "@/components/ui/FormInput";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { SCREEN_BOTTOM_PADDING } from "@/constants/layout";
import { eventCanHaveCost, eventCanSchedule } from "@/shared/pet-event-schemas";
import { PetEventType } from "@/types/pet-event.types";
import React, { useCallback, useEffect, useMemo } from "react";
import {
  Controller,
  FormProvider,
  useWatch,
  type UseFormReturn,
} from "react-hook-form";
import { useTranslation } from "react-i18next";
import { ScrollView, Switch, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { z } from "zod";

export const eventFormSchema = z
  .object({
    mode: z.enum(["past", "future"]),
    type: z.nativeEnum(PetEventType),
    occurredAt: z.date().nullable().optional(),
    scheduledFor: z.date().nullable().optional(),
    title: z.string().min(1, "required").max(120),
    description: z.string().max(2000).nullable().optional(),
    cost: z.string().optional(),
    mediaAssetIds: z.array(z.string()).max(MAX_ATTACHMENTS).optional(),
    createReminder: z.boolean().optional(),
    createExpense: z.boolean().optional(),
    vaccineName: z.string().max(120).optional(),
  })
  .superRefine((v, ctx) => {
    if (v.mode === "past" && !v.occurredAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["occurredAt"],
        message: "required",
      });
    }
    if (v.mode === "future" && !v.scheduledFor) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["scheduledFor"],
        message: "required",
      });
    }
    if (
      v.type === PetEventType.VACCINATION &&
      (!v.vaccineName || v.vaccineName.trim().length === 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["vaccineName"],
        message: "required",
      });
    }
  });

export type EventFormValues = z.infer<typeof eventFormSchema>;

/**
 * Builds the polymorphic `extra` payload sent to the backend based on
 * the event type. Returns `undefined` when no type-specific data is
 * collected so the API receives a clean optional field.
 */
export function buildExtra(
  values: EventFormValues,
): Record<string, unknown> | undefined {
  if (values.type === PetEventType.VACCINATION) {
    const name = values.vaccineName?.trim();
    if (!name) return undefined;
    return { vaccineName: name };
  }
  return undefined;
}

interface EventFormProps {
  form: UseFormReturn<EventFormValues>;
  isSubmitting: boolean;
  submitLabel: string;
  onSubmit: (values: EventFormValues) => void;
  disableTypeChange?: boolean;
}

export function EventForm({
  form,
  isSubmitting,
  submitLabel,
  onSubmit,
  disableTypeChange = false,
}: EventFormProps) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const insets = useSafeAreaInsets();

  const mode = useWatch({ control: form.control, name: "mode" });
  const selectedType = useWatch({ control: form.control, name: "type" });
  const costValue = useWatch({ control: form.control, name: "cost" });

  const parsedCost = parseFloat(costValue ?? "");
  const costIsValid = !isNaN(parsedCost) && parsedCost > 0;

  // Capability gates from the global PET_EVENT_CAPABILITIES map.
  // Some event types (WEIGHT_RECORD, NOTE, PHOTO, …) cannot have a cost
  // and/or cannot spawn reminders, so the corresponding form sections
  // must disappear entirely.
  const typeCanHaveCost = eventCanHaveCost(selectedType);
  const typeCanSchedule = eventCanSchedule(selectedType);

  // Auto-reset the expense toggle whenever cost becomes invalid OR the
  // selected event type cannot have a cost, so it can never be ON in an
  // inconsistent state.
  useEffect(() => {
    if (!costIsValid || !typeCanHaveCost) {
      form.setValue("createExpense", false);
    }
  }, [costIsValid, typeCanHaveCost, form]);

  // If the user picks a non-schedulable type, force `createReminder=false`.
  useEffect(() => {
    if (!typeCanSchedule) {
      form.setValue("createReminder", false);
    }
  }, [typeCanSchedule, form]);

  const typeOptions = useMemo<ChipOption<PetEventType>[]>(
    () => [
      {
        value: PetEventType.VET_VISIT,
        label: t("petDetail.timeline.types.VET_VISIT"),
        icon: "stethoscope",
      },
      {
        value: PetEventType.VACCINATION,
        label: t("petDetail.timeline.types.VACCINATION"),
        icon: "syringe",
      },
      {
        value: PetEventType.PARASITE_TREATMENT,
        label: t("petDetail.timeline.types.PARASITE_TREATMENT"),
        icon: "shield.checkerboard",
      },
      {
        value: PetEventType.GROOMING,
        label: t("petDetail.timeline.types.GROOMING"),
        icon: "scissors",
      },
      // WEIGHT_RECORD is intentionally excluded: weights are logged via
      // the dedicated /pets/:id/weights screen so the canonical
      // weightMg payload is always set.
      {
        value: PetEventType.WATER_PARAMETERS,
        label: t("petDetail.timeline.types.WATER_PARAMETERS"),
        icon: "drop.fill",
      },
      {
        value: PetEventType.WATER_CHANGE,
        label: t("petDetail.timeline.types.WATER_CHANGE"),
        icon: "arrow.triangle.2.circlepath",
      },
      {
        value: PetEventType.MOLT,
        label: t("petDetail.timeline.types.MOLT"),
        icon: "leaf.fill",
      },
      {
        value: PetEventType.FEEDING_LOG,
        label: t("petDetail.timeline.types.FEEDING_LOG"),
        icon: "fork.knife",
      },
      {
        value: PetEventType.MEDICATION,
        label: t("petDetail.timeline.types.MEDICATION"),
        icon: "pill.fill",
      },
      {
        value: PetEventType.PHOTO,
        label: t("petDetail.timeline.types.PHOTO"),
        icon: "camera.fill",
      },
      {
        value: PetEventType.NOTE,
        label: t("petDetail.timeline.types.NOTE"),
        icon: "note.text",
      },
      {
        value: PetEventType.INSURANCE,
        label: t("petDetail.timeline.types.INSURANCE"),
        icon: "shield.fill",
      },
    ],
    [t],
  );

  const handleSubmit = form.handleSubmit(onSubmit);

  const modeOptions = useMemo<ChipOption<"past" | "future">[]>(
    () => [
      {
        value: "past",
        label: t("eventForm.mode_past"),
      },
      {
        value: "future",
        label: t("eventForm.mode_future"),
      },
    ],
    [t],
  );

  const setMode = useCallback(
    (m: "past" | "future") => {
      form.setValue("mode", m);
      form.clearErrors(["occurredAt", "scheduledFor"]);
    },
    [form],
  );

  return (
    <FormProvider {...form}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: SCREEN_BOTTOM_PADDING + insets.bottom + 80 },
        ]}
      >
        {/* Mode toggle */}
        <SectionLabel style={styles.sectionLabel}>
          {t("eventForm.mode")}
        </SectionLabel>
        <ChipSelector options={modeOptions} value={mode} onChange={setMode} />

        {/* Event type picker */}
        {!disableTypeChange ? (
          <>
            <SectionLabel style={styles.sectionLabel}>
              {t("eventForm.type")}
            </SectionLabel>
            <ChipSelector
              options={typeOptions}
              value={selectedType}
              onChange={(type) => {
                form.setValue("type", type, {
                  shouldDirty: true,
                  shouldTouch: true,
                });
              }}
            />
          </>
        ) : null}

        {/* Date */}
        <SectionLabel style={styles.sectionLabel}>
          {t(
            mode === "past" ? "eventForm.occurredAt" : "eventForm.scheduledFor",
          )}
        </SectionLabel>
        <FormCard style={styles.card}>
          <Controller
            control={form.control}
            name={mode === "past" ? "occurredAt" : "scheduledFor"}
            render={({ field }) => (
              <DateField
                value={field.value instanceof Date ? field.value : null}
                onChange={field.onChange}
                maximumDate={mode === "past" ? new Date() : undefined}
                minimumDate={mode === "future" ? new Date() : undefined}
                placeholder={t("common.tapToSet") as string}
              />
            )}
          />
        </FormCard>

        {/* Reminder toggle — only for future/scheduled events whose type
            is schedulable (e.g. NOTE/PHOTO/WEIGHT_RECORD have no reminder). */}
        {mode === "future" && typeCanSchedule ? (
          <>
            <SectionLabel style={styles.sectionLabel}>
              {t("eventForm.createReminder")}
            </SectionLabel>
            <FormCard style={styles.card}>
              <Controller
                control={form.control}
                name="createReminder"
                render={({ field }) => (
                  <View style={styles.reminderRow}>
                    <View style={styles.reminderText}>
                      <Text
                        style={[
                          styles.reminderLabel,
                          { color: theme.colors.textPrimary },
                        ]}
                      >
                        {t("eventForm.createReminder")}
                      </Text>
                      <Text
                        style={[
                          styles.reminderSubtitle,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        {t("eventForm.createReminderSubtitle")}
                      </Text>
                    </View>
                    <Switch
                      // Mirror the actual form value: avoids a UI/payload
                      // mismatch where the toggle showed ON while the form
                      // submitted `false` (or vice versa) on edit.
                      value={!!field.value}
                      onValueChange={field.onChange}
                      trackColor={{
                        false: theme.colors.border,
                        true: theme.colors.primary,
                      }}
                    />
                  </View>
                )}
              />
            </FormCard>
          </>
        ) : null}

        {/* Attachments — prominent for PHOTO, secondary otherwise */}
        {selectedType === PetEventType.PHOTO ? (
          <>
            <SectionLabel style={styles.sectionLabel}>
              {t("eventForm.attachments")}
            </SectionLabel>
            <Controller
              control={form.control}
              name="mediaAssetIds"
              render={({ field }) => (
                <AttachmentSection
                  value={field.value ?? []}
                  onChange={field.onChange}
                />
              )}
            />
          </>
        ) : null}

        {/* Title + description */}
        <SectionLabel style={styles.sectionLabel}>
          {t("eventForm.details")}
        </SectionLabel>
        <FormCard dividedChildren style={styles.card}>
          <FormInput
            name="title"
            placeholder={t("eventForm.titlePlaceholder")}
            returnKeyType="next"
          />
          <FormInput
            name="description"
            placeholder={t("eventForm.descriptionPlaceholder")}
            multiline
            numberOfLines={3}
            returnKeyType="done"
          />
        </FormCard>

        {/* Vaccine-specific fields */}
        {selectedType === PetEventType.VACCINATION ? (
          <>
            <SectionLabel style={styles.sectionLabel}>
              {t("eventForm.vaccineDetails")}
            </SectionLabel>
            <FormCard style={styles.card}>
              <FormInput
                name="vaccineName"
                placeholder={t("eventForm.vaccineNamePlaceholder")}
                returnKeyType="done"
              />
            </FormCard>
          </>
        ) : null}

        {/* Cost — hidden for event types that have no cost concept
            (WEIGHT_RECORD, NOTE, PHOTO, WATER_PARAMETERS, …). */}
        {typeCanHaveCost ? (
          <>
            <SectionLabel style={styles.sectionLabel}>
              {t("eventForm.cost")}
            </SectionLabel>
            <FormCard style={styles.card}>
              <FormInput
                name="cost"
                placeholder="0.00"
                keyboardType="decimal-pad"
                returnKeyType="done"
              />
            </FormCard>
          </>
        ) : null}

        {/* Expense toggle — only for past events with a valid cost AND a
            cost-capable type. */}
        {mode === "past" && typeCanHaveCost ? (
          <FormCard style={styles.card}>
            <Controller
              control={form.control}
              name="createExpense"
              render={({ field }) => (
                <View style={styles.reminderRow}>
                  <View style={styles.reminderText}>
                    <Text
                      style={[
                        styles.reminderLabel,
                        {
                          color: costIsValid
                            ? theme.colors.textPrimary
                            : theme.colors.textTertiary,
                        },
                      ]}
                    >
                      {t("eventForm.recordExpense")}
                    </Text>
                    <Text
                      style={[
                        styles.reminderSubtitle,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      {t("eventForm.recordExpenseSubtitle")}
                    </Text>
                  </View>
                  <Switch
                    value={costIsValid ? (field.value ?? false) : false}
                    onValueChange={costIsValid ? field.onChange : undefined}
                    disabled={!costIsValid}
                    trackColor={{
                      false: theme.colors.border,
                      true: theme.colors.primary,
                    }}
                    thumbColor={
                      costIsValid ? undefined : theme.colors.textTertiary
                    }
                  />
                </View>
              )}
            />
          </FormCard>
        ) : null}

        {/* Attachments — secondary position for non-PHOTO event types */}
        {selectedType !== PetEventType.PHOTO ? (
          <>
            <SectionLabel style={styles.sectionLabel}>
              {t("eventForm.attachments")}
            </SectionLabel>
            <Controller
              control={form.control}
              name="mediaAssetIds"
              render={({ field }) => (
                <AttachmentSection
                  value={field.value ?? []}
                  onChange={field.onChange}
                />
              )}
            />
          </>
        ) : null}

        {/* Submit */}
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
          onPress={() => void handleSubmit()}
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
  reminderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing.xs,
    gap: theme.spacing.md,
  },
  reminderText: {
    flex: 1,
    gap: 2,
  },
  reminderLabel: {
    ...theme.typography.subhead,
    fontWeight: "500",
  },
  reminderSubtitle: {
    ...theme.typography.caption,
  },
}));

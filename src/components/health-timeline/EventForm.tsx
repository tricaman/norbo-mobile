import { NorboPressable } from "@/components/CustomPressable";
import { DateField } from "@/components/ui/DateField";
import { FormCard } from "@/components/ui/FormCard";
import { FormInput } from "@/components/ui/FormInput";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { SCREEN_BOTTOM_PADDING } from "@/constants/layout";
import { PetEventType } from "@/types/pet-event.types";
import React, { useCallback } from "react";
import { Controller, FormProvider, type UseFormReturn } from "react-hook-form";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { useTranslation } from "react-i18next";
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
  });

export type EventFormValues = z.infer<typeof eventFormSchema>;

const EVENT_TYPES = Object.values(PetEventType);

const TYPE_ICONS: Record<PetEventType, string> = {
  [PetEventType.VACCINATION]: "syringe",
  [PetEventType.VET_VISIT]: "stethoscope",
  [PetEventType.PARASITE_TREATMENT]: "shield.checkerboard",
  [PetEventType.GROOMING]: "scissors",
  [PetEventType.WEIGHT_RECORD]: "scalemass",
  [PetEventType.WATER_PARAMETERS]: "drop.fill",
  [PetEventType.WATER_CHANGE]: "arrow.triangle.2.circlepath",
  [PetEventType.MOLT]: "leaf.fill",
  [PetEventType.FEEDING_LOG]: "fork.knife",
  [PetEventType.MEDICATION]: "pill.fill",
  [PetEventType.PHOTO]: "camera.fill",
  [PetEventType.NOTE]: "note.text",
};

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

  const mode = form.watch("mode");
  const selectedType = form.watch("type");

  const handleSubmit = form.handleSubmit(onSubmit);

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
        <View style={styles.modeRow}>
          {(["past", "future"] as const).map((m) => {
            const active = mode === m;
            return (
              <NorboPressable
                key={m}
                style={[
                  styles.modeBtn,
                  {
                    backgroundColor: active
                      ? theme.colors.primary
                      : theme.colors.surface,
                    borderColor: active
                      ? theme.colors.primary
                      : theme.colors.border,
                  },
                ]}
                haptic="light"
                onPress={() => setMode(m)}
              >
                <Text
                  style={[
                    styles.modeBtnLabel,
                    {
                      color: active
                        ? theme.colors.textOnPrimary
                        : theme.colors.textSecondary,
                    },
                  ]}
                >
                  {t(`eventForm.mode_${m}` as "eventForm.mode_past")}
                </Text>
              </NorboPressable>
            );
          })}
        </View>

        {/* Event type picker */}
        {!disableTypeChange ? (
          <>
            <SectionLabel style={styles.sectionLabel}>
              {t("eventForm.type")}
            </SectionLabel>
            <View style={styles.typeGrid}>
              {EVENT_TYPES.map((type) => {
                const active = selectedType === type;
                return (
                  <NorboPressable
                    key={type}
                    style={[
                      styles.typeChip,
                      {
                        backgroundColor: active
                          ? `${theme.colors.primary}22`
                          : theme.colors.surface,
                        borderColor: active
                          ? theme.colors.primary
                          : theme.colors.border,
                      },
                    ]}
                    haptic="light"
                    onPress={() => form.setValue("type", type)}
                  >
                    <IconSymbol
                      name={TYPE_ICONS[type] ?? "calendar"}
                      size={16}
                      tintColor={
                        active
                          ? theme.colors.primary
                          : theme.colors.textTertiary
                      }
                    />
                    <Text
                      style={[
                        styles.typeChipLabel,
                        {
                          color: active
                            ? theme.colors.primary
                            : theme.colors.textSecondary,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {t(
                        `petDetail.timeline.types.${type}` as "petDetail.timeline.types.VACCINATION",
                      )}
                    </Text>
                  </NorboPressable>
                );
              })}
            </View>
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

        {/* Cost */}
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
  modeRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.md,
    borderWidth: theme.hairline,
    alignItems: "center",
  },
  modeBtnLabel: {
    ...theme.typography.subhead,
    fontWeight: "600",
  },
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  typeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 7,
    borderRadius: theme.radius.md,
    borderWidth: theme.hairline,
    maxWidth: "48%",
    minWidth: "45%",
    flex: 1,
  },
  typeChipLabel: {
    ...theme.typography.caption,
    fontWeight: "500",
    flexShrink: 1,
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

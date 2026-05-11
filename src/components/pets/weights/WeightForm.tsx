import { NorboPressable } from "@/components/CustomPressable";
import { ChipSelector, type ChipOption } from "@/components/ui/ChipSelector";
import { DateField } from "@/components/ui/DateField";
import { FormCard } from "@/components/ui/FormCard";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { SCREEN_BOTTOM_PADDING } from "@/constants/layout";
import {
  defaultUnitForCategory,
  toMilligrams,
  WEIGHT_UNITS,
  type WeightUnit,
} from "@/utils/weight";
import { PetCategory } from "@/types/pet.types";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

export interface WeightFormSubmit {
  weightMg: number;
  occurredAt: Date;
  notes: string | null;
}

interface WeightFormProps {
  category: PetCategory;
  initialWeightMg?: number | null;
  initialOccurredAt?: Date | null;
  initialNotes?: string | null;
  initialUnit?: WeightUnit;
  isSubmitting: boolean;
  submitLabel: string;
  onSubmit: (values: WeightFormSubmit) => void;
}

/**
 * WeightForm — date + numeric value + unit picker + optional notes.
 *
 * Persists in canonical milligrams via {@link toMilligrams}; the
 * unit picker is purely a display-time convenience and is not stored
 * server-side. Defaults to a sensible unit for the pet's category.
 */
export function WeightForm({
  category,
  initialWeightMg,
  initialOccurredAt,
  initialNotes,
  initialUnit,
  isSubmitting,
  submitLabel,
  onSubmit,
}: WeightFormProps) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const insets = useSafeAreaInsets();

  const [unit, setUnit] = useState<WeightUnit>(
    initialUnit ?? defaultUnitForCategory(category),
  );
  const [text, setText] = useState(() => {
    if (initialWeightMg == null) return "";
    const initUnit = initialUnit ?? defaultUnitForCategory(category);
    return formatInitialValue(initialWeightMg, initUnit);
  });
  const [occurredAt, setOccurredAt] = useState<Date>(
    initialOccurredAt ?? new Date(),
  );
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [error, setError] = useState<string | null>(null);

  const unitOptions = useMemo<ChipOption<WeightUnit>[]>(
    () =>
      WEIGHT_UNITS.map((u) => ({
        value: u,
        label: u,
      })),
    [],
  );

  function handleSubmit() {
    const parsed = parseFloat(text.replace(",", "."));
    const mg = Number.isFinite(parsed) ? toMilligrams(parsed, unit) : null;
    if (mg == null) {
      setError(t("weightForm.errorInvalid"));
      return;
    }
    setError(null);
    onSubmit({
      weightMg: mg,
      occurredAt,
      notes: notes.trim().length > 0 ? notes.trim() : null,
    });
  }

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[
        styles.scroll,
        { paddingBottom: SCREEN_BOTTOM_PADDING + insets.bottom + 80 },
      ]}
    >
      <SectionLabel style={styles.sectionLabel}>
        {t("weightForm.dateLabel")}
      </SectionLabel>
      <FormCard style={styles.card}>
        <DateField
          value={occurredAt}
          onChange={setOccurredAt}
          maximumDate={new Date()}
        />
      </FormCard>

      <SectionLabel style={styles.sectionLabel}>
        {t("weightForm.weightLabel")}
      </SectionLabel>
      <FormCard style={styles.card}>
        <TextInput
          value={text}
          onChangeText={(v) => {
            setText(v);
            if (error) setError(null);
          }}
          placeholder="0"
          placeholderTextColor={theme.colors.textTertiary}
          keyboardType="decimal-pad"
          returnKeyType="done"
          style={[styles.numberInput, { color: theme.colors.textPrimary }]}
        />
      </FormCard>

      <SectionLabel style={styles.sectionLabel}>
        {t("weightForm.unitLabel")}
      </SectionLabel>
      <ChipSelector<WeightUnit>
        options={unitOptions}
        value={unit}
        onChange={setUnit}
      />

      <SectionLabel style={styles.sectionLabel}>
        {t("weightForm.notesLabel")}
      </SectionLabel>
      <FormCard style={styles.card}>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder={t("weightForm.notesPlaceholder") as string}
          placeholderTextColor={theme.colors.textTertiary}
          multiline
          numberOfLines={3}
          style={[styles.notesInput, { color: theme.colors.textPrimary }]}
        />
      </FormCard>

      {error ? (
        <Text style={[styles.error, { color: theme.colors.error }]}>
          {error}
        </Text>
      ) : null}

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
        onPress={handleSubmit}
      >
        <Text
          style={[styles.submitLabel, { color: theme.colors.textOnPrimary }]}
        >
          {submitLabel}
        </Text>
      </NorboPressable>
    </ScrollView>
  );
}

function formatInitialValue(mg: number, unit: WeightUnit): string {
  // Mirror utils/weight.ts factor table for inverse conversion.
  const FACTOR: Record<WeightUnit, number> = {
    mg: 1,
    g: 1_000,
    kg: 1_000_000,
    oz: 28_349.5,
    lb: 453_592,
  };
  const value = mg / FACTOR[unit];
  return value.toFixed(value < 10 ? 2 : 1).replace(/\.?0+$/, "");
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
  numberInput: {
    ...theme.typography.title2,
    fontWeight: "600",
    paddingVertical: theme.spacing.sm,
    textAlign: "center",
  },
  notesInput: {
    ...theme.typography.body,
    minHeight: 60,
    paddingVertical: theme.spacing.sm,
  },
  error: {
    ...theme.typography.footnote,
    marginTop: theme.spacing.md,
    textAlign: "center",
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

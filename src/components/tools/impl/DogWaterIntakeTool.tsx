import {
  ToolNumberField,
  ToolResultCard,
  ToolSection,
  ToolUnitToggle,
} from "@/components/tools/ui";
import { useDebounce } from "@/hooks/useDebounce";
import { useDogs } from "@/hooks/useDogs";
import { useWeightHistory } from "@/hooks/useWeightHistory";
import type { ServiceToolInput } from "@/shared/services-contract";
import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { ToolComponent } from "../tool-component";

type Inputs = ServiceToolInput<"dog-water-intake">;

// Indicative reference: ~50–70 ml of water per kg of body weight per day.
const ML_PER_KG_LOW = 50;
const ML_PER_KG_HIGH = 70;

const DogWaterIntakeTool: ToolComponent<"dog-water-intake"> = ({
  initialInputs,
  onInputsChange,
}) => {
  const { t } = useTranslation();
  const { dogs } = useDogs();
  const [dogId, setDogId] = React.useState<string | null>(null);
  const selectedId = dogId ?? dogs[0]?.id ?? null;

  // Pre-fill from the selected dog's latest recorded weight (override-able).
  const { latest } = useWeightHistory(selectedId ?? "");
  const profileWeightKg =
    latest != null ? Math.round((latest.weightMg / 1_000_000) * 10) / 10 : null;

  const [weightKg, setWeightKg] = React.useState<number | null>(
    initialInputs?.weightKg ?? null,
  );
  // Seed once from the profile when the field is still empty.
  const seededFor = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (
      weightKg == null &&
      profileWeightKg != null &&
      seededFor.current !== selectedId
    ) {
      seededFor.current = selectedId;
      setWeightKg(profileWeightKg);
    }
  }, [profileWeightKg, selectedId, weightKg]);

  const complete: Inputs | null =
    weightKg != null && weightKg > 0 ? { weightKg } : null;
  const debounced = useDebounce(complete, 600);
  React.useEffect(() => {
    if (debounced) onInputsChange(debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const range =
    weightKg != null && weightKg > 0
      ? {
          low: Math.round(weightKg * ML_PER_KG_LOW),
          high: Math.round(weightKg * ML_PER_KG_HIGH),
        }
      : null;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {dogs.length > 1 ? (
        <ToolUnitToggle<string>
          options={dogs.map((d) => ({ value: d.id, label: d.name }))}
          value={selectedId ?? ""}
          onChange={(id) => {
            setDogId(id);
            seededFor.current = null;
            setWeightKg(null);
          }}
        />
      ) : null}

      <ToolNumberField
        label={t("tools.dogWaterIntake.weight")}
        value={weightKg}
        onChangeValue={setWeightKg}
        unit="kg"
        placeholder="0"
      />

      {range ? (
        <ToolSection label={t("tools.dogWaterIntake.result")}>
          <ToolResultCard
            label={t("tools.dogWaterIntake.daily")}
            value={`${range.low}–${range.high}`}
            unit="ml"
            caption={`${(range.low / 1000).toFixed(2)}–${(range.high / 1000).toFixed(2)} L`}
          />
          <View style={styles.notes}>
            <Text style={styles.noteTitle}>{t("tools.dogWaterIntake.factorsTitle")}</Text>
            <Text style={styles.note}>{t("tools.dogWaterIntake.factors")}</Text>
            <Text style={styles.disclaimer}>{t("tools.dogWaterIntake.disclaimer")}</Text>
          </View>
        </ToolSection>
      ) : null}
    </ScrollView>
  );
};

export default DogWaterIntakeTool;

const styles = StyleSheet.create((theme) => ({
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    paddingBottom: theme.spacing["4xl"],
  },
  notes: { gap: theme.spacing.xs },
  noteTitle: {
    ...theme.typography.footnote,
    color: theme.colors.textPrimary,
  },
  note: {
    ...theme.typography.footnote,
    color: theme.colors.textSecondary,
  },
  disclaimer: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
  },
}));

import { ToolNumberField, ToolResultCard, ToolSection } from "@/components/tools/ui";
import { useDebounce } from "@/hooks/useDebounce";
import type { ServiceToolInput } from "@/shared/services-contract";
import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { ToolComponent } from "../tool-component";

type Inputs = ServiceToolInput<"horse-weight-estimator">;

const HorseWeightEstimatorTool: ToolComponent<"horse-weight-estimator"> = ({
  initialInputs,
  onInputsChange,
}) => {
  const { t } = useTranslation();
  const [heartGirthCm, setHeartGirthCm] = React.useState<number | null>(
    initialInputs?.heartGirthCm ?? null,
  );
  const [bodyLengthCm, setBodyLengthCm] = React.useState<number | null>(
    initialInputs?.bodyLengthCm ?? null,
  );

  const complete: Inputs | null =
    heartGirthCm != null &&
    heartGirthCm >= 80 &&
    heartGirthCm <= 280 &&
    bodyLengthCm != null &&
    bodyLengthCm >= 60 &&
    bodyLengthCm <= 260
      ? { heartGirthCm, bodyLengthCm }
      : null;
  const debounced = useDebounce(complete, 600);
  React.useEffect(() => {
    if (debounced) onInputsChange(debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  // Carroll & Huntington (1988): BW(kg) = heartGirthCm² × bodyLengthCm / 11877
  const weightKg = complete
    ? Math.round(
        (complete.heartGirthCm ** 2 * complete.bodyLengthCm) / 11877 / 5,
      ) * 5
    : null;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.note}>
        {t("tools.horseWeightEstimator.howToMeasure")}
      </Text>

      <ToolNumberField
        label={t("tools.horseWeightEstimator.heartGirth")}
        value={heartGirthCm}
        onChangeValue={setHeartGirthCm}
        unit="cm"
        placeholder="0"
      />
      <ToolNumberField
        label={t("tools.horseWeightEstimator.bodyLength")}
        value={bodyLengthCm}
        onChangeValue={setBodyLengthCm}
        unit="cm"
        placeholder="0"
      />

      {weightKg != null ? (
        <ToolSection>
          <ToolResultCard
            label={t("tools.horseWeightEstimator.result")}
            value={String(weightKg)}
            unit="kg"
          />
          <View style={styles.notes}>
            <Text style={styles.note}>
              {t("tools.horseWeightEstimator.tip")}
            </Text>
            <Text style={styles.disclaimer}>
              {t("tools.horseWeightEstimator.disclaimer")}
            </Text>
          </View>
        </ToolSection>
      ) : null}
    </ScrollView>
  );
};

export default HorseWeightEstimatorTool;

const styles = StyleSheet.create((theme) => ({
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    paddingBottom: theme.spacing["4xl"],
  },
  notes: { gap: theme.spacing.xs },
  note: { ...theme.typography.footnote, color: theme.colors.textSecondary },
  disclaimer: { ...theme.typography.caption, color: theme.colors.textTertiary },
}));

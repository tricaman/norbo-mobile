import {
  ToolNumberField,
  ToolResultCard,
  ToolSection,
  ToolUnitToggle,
} from "@/components/tools/ui";
import { useDebounce } from "@/hooks/useDebounce";
import type { ServiceToolInput } from "@/shared/services-contract";
import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { ToolComponent } from "../tool-component";

type Inputs = ServiceToolInput<"dog-calorie-needs">;
type Activity = Inputs["activity"];

/**
 * Daily energy requirement (MER) from the published RER formula:
 *   RER = 70 × weightKg^0.75,  MER = RER × lifestage/activity factor.
 * Indicative husbandry estimate — never a clinical or drug dose.
 */
function mer(weightKg: number, ageMonths: number, activity: Activity, neutered: boolean): number {
  const rer = 70 * Math.pow(weightKg, 0.75);
  let factor: number;
  if (ageMonths < 4) factor = 3.0; // early growth
  else if (ageMonths < 12) factor = 2.0; // growth
  else if (activity === "LOW") factor = 1.4;
  else if (activity === "HIGH") factor = 2.0;
  else factor = neutered ? 1.6 : 1.8; // neutered vs intact adult
  return rer * factor;
}

const DogCalorieTool: ToolComponent<"dog-calorie-needs"> = ({
  initialInputs,
  onInputsChange,
}) => {
  const { t } = useTranslation();
  const [weightKg, setWeightKg] = React.useState<number | null>(
    initialInputs?.weightKg ?? null,
  );
  const [ageMonths, setAgeMonths] = React.useState<number | null>(
    initialInputs?.ageMonths ?? null,
  );
  const [activity, setActivity] = React.useState<Activity>(
    initialInputs?.activity ?? "NORMAL",
  );
  const [neutered, setNeutered] = React.useState<boolean>(
    initialInputs?.neutered ?? false,
  );

  // Notify the loader of complete, valid inputs (debounced so we persist on
  // pause, not on every keystroke). Persistence itself lives in the loader.
  const complete: Inputs | null =
    weightKg != null && weightKg > 0 && ageMonths != null
      ? { weightKg, ageMonths, activity, neutered }
      : null;
  const debounced = useDebounce(complete, 600);
  React.useEffect(() => {
    if (debounced) onInputsChange(debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const kcal =
    weightKg != null && weightKg > 0 && ageMonths != null
      ? Math.round(mer(weightKg, ageMonths, activity, neutered))
      : null;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <ToolNumberField
        label={t("tools.dogCalorieNeeds.weight")}
        value={weightKg}
        onChangeValue={setWeightKg}
        unit="kg"
        placeholder="0"
      />
      <ToolNumberField
        label={t("tools.dogCalorieNeeds.age")}
        value={ageMonths}
        onChangeValue={setAgeMonths}
        unit={t("tools.dogCalorieNeeds.months")}
        placeholder="0"
      />

      <ToolSection label={t("tools.dogCalorieNeeds.activity")}>
        <ToolUnitToggle<Activity>
          options={[
            { value: "LOW", label: t("tools.dogCalorieNeeds.low") },
            { value: "NORMAL", label: t("tools.dogCalorieNeeds.normal") },
            { value: "HIGH", label: t("tools.dogCalorieNeeds.high") },
          ]}
          value={activity}
          onChange={setActivity}
        />
        <ToolUnitToggle<"yes" | "no">
          options={[
            { value: "yes", label: t("tools.dogCalorieNeeds.neuteredYes") },
            { value: "no", label: t("tools.dogCalorieNeeds.neuteredNo") },
          ]}
          value={neutered ? "yes" : "no"}
          onChange={(v) => setNeutered(v === "yes")}
        />
      </ToolSection>

      {kcal != null ? (
        <ToolResultCard
          label={t("tools.dogCalorieNeeds.result")}
          value={String(kcal)}
          unit="kcal/day"
          caption={t("tools.dogCalorieNeeds.disclaimer")}
        />
      ) : null}
    </ScrollView>
  );
};

export default DogCalorieTool;

const styles = StyleSheet.create((theme) => ({
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    paddingBottom: theme.spacing["4xl"],
  },
}));

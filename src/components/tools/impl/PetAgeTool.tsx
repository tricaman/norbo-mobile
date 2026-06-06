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

type Inputs = ServiceToolInput<"pet-age-human-years">;
type SizeClass = Inputs["sizeClass"];

const PER_YEAR_AFTER_TWO: Record<SizeClass, number> = {
  SMALL: 4,
  MEDIUM: 5,
  LARGE: 6,
};

/**
 * Indicative pet-age → human-equivalent-years curve (widely-used husbandry
 * approximation): ~15 human years in year 1, +9 in year 2 (so 2y ≈ 24), then
 * a size-dependent rate per further year. Not clinical.
 */
function humanYears(ageMonths: number, size: SizeClass): number {
  const years = ageMonths / 12;
  if (years <= 0) return 0;
  if (years <= 1) return Math.round(15 * years);
  if (years <= 2) return Math.round(15 + 9 * (years - 1));
  return Math.round(24 + PER_YEAR_AFTER_TWO[size] * (years - 2));
}

const PetAgeTool: ToolComponent<"pet-age-human-years"> = ({
  initialInputs,
  onInputsChange,
}) => {
  const { t } = useTranslation();
  const [ageMonths, setAgeMonths] = React.useState<number | null>(
    initialInputs?.ageMonths ?? null,
  );
  const [sizeClass, setSizeClass] = React.useState<SizeClass>(
    initialInputs?.sizeClass ?? "MEDIUM",
  );

  const complete: Inputs | null =
    ageMonths != null ? { ageMonths, sizeClass } : null;
  const debounced = useDebounce(complete, 600);
  React.useEffect(() => {
    if (debounced) onInputsChange(debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const human = ageMonths != null ? humanYears(ageMonths, sizeClass) : null;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <ToolNumberField
        label={t("tools.petAgeHumanYears.age")}
        value={ageMonths}
        onChangeValue={setAgeMonths}
        unit={t("tools.petAgeHumanYears.months")}
        placeholder="0"
      />

      <ToolSection label={t("tools.petAgeHumanYears.size")}>
        <ToolUnitToggle<SizeClass>
          options={[
            { value: "SMALL", label: t("tools.petAgeHumanYears.small") },
            { value: "MEDIUM", label: t("tools.petAgeHumanYears.medium") },
            { value: "LARGE", label: t("tools.petAgeHumanYears.large") },
          ]}
          value={sizeClass}
          onChange={setSizeClass}
        />
      </ToolSection>

      {human != null ? (
        <ToolResultCard
          label={t("tools.petAgeHumanYears.result")}
          value={String(human)}
          unit={t("tools.petAgeHumanYears.years")}
          caption={t("tools.petAgeHumanYears.disclaimer")}
        />
      ) : null}
    </ScrollView>
  );
};

export default PetAgeTool;

const styles = StyleSheet.create((theme) => ({
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    paddingBottom: theme.spacing["4xl"],
  },
}));

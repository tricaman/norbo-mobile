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

type Inputs = ServiceToolInput<"aquarium-volume">;
type VolumeUnit = "L" | "gal";

const LITRES_PER_GALLON = 3.78541;

function formatVolume(litres: number, unit: VolumeUnit): string {
  const value = unit === "gal" ? litres / LITRES_PER_GALLON : litres;
  return value.toFixed(1);
}

const AquariumVolumeTool: ToolComponent<"aquarium-volume"> = ({
  initialInputs,
  onInputsChange,
}) => {
  const { t } = useTranslation();
  const [lengthCm, setLengthCm] = React.useState<number | null>(
    initialInputs?.lengthCm ?? null,
  );
  const [widthCm, setWidthCm] = React.useState<number | null>(
    initialInputs?.widthCm ?? null,
  );
  const [heightCm, setHeightCm] = React.useState<number | null>(
    initialInputs?.heightCm ?? null,
  );
  const [decorPercent, setDecorPercent] = React.useState<number | null>(
    initialInputs?.decorPercent ?? 10,
  );
  const [unit, setUnit] = React.useState<VolumeUnit>("L");

  const complete: Inputs | null =
    lengthCm && widthCm && heightCm && decorPercent != null
      ? { lengthCm, widthCm, heightCm, decorPercent }
      : null;
  const debounced = useDebounce(complete, 600);
  React.useEffect(() => {
    if (debounced) onInputsChange(debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const result =
    lengthCm && widthCm && heightCm && decorPercent != null
      ? (() => {
          const grossL = (lengthCm * widthCm * heightCm) / 1000;
          const netL = grossL * (1 - decorPercent / 100);
          // Indicative freshwater rule of thumb: ~1 cm of adult fish per litre.
          const stockingCm = Math.round(netL);
          return { grossL, netL, stockingCm };
        })()
      : null;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <ToolNumberField
        label={t("tools.aquariumVolume.length")}
        value={lengthCm}
        onChangeValue={setLengthCm}
        unit="cm"
        placeholder="0"
      />
      <ToolNumberField
        label={t("tools.aquariumVolume.width")}
        value={widthCm}
        onChangeValue={setWidthCm}
        unit="cm"
        placeholder="0"
      />
      <ToolNumberField
        label={t("tools.aquariumVolume.height")}
        value={heightCm}
        onChangeValue={setHeightCm}
        unit="cm"
        placeholder="0"
      />
      <ToolNumberField
        label={t("tools.aquariumVolume.decor")}
        value={decorPercent}
        onChangeValue={setDecorPercent}
        unit="%"
        placeholder="0"
      />

      {result ? (
        <ToolSection label={t("tools.aquariumVolume.results")}>
          <ToolUnitToggle<VolumeUnit>
            options={[
              { value: "L", label: "L" },
              { value: "gal", label: "gal" },
            ]}
            value={unit}
            onChange={setUnit}
          />
          <ToolResultCard
            label={t("tools.aquariumVolume.gross")}
            value={formatVolume(result.grossL, unit)}
            unit={unit}
          />
          <ToolResultCard
            label={t("tools.aquariumVolume.effective")}
            value={formatVolume(result.netL, unit)}
            unit={unit}
          />
          <ToolResultCard
            label={t("tools.aquariumVolume.stocking")}
            value={String(result.stockingCm)}
            unit={t("tools.aquariumVolume.stockingUnit")}
            caption={t("tools.aquariumVolume.disclaimer")}
          />
        </ToolSection>
      ) : null}
    </ScrollView>
  );
};

export default AquariumVolumeTool;

const styles = StyleSheet.create((theme) => ({
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    paddingBottom: theme.spacing["4xl"],
  },
}));

import { ToolNumberField, ToolResultCard, ToolSection } from "@/components/tools/ui";
import { useDebounce } from "@/hooks/useDebounce";
import type { ServiceToolInput } from "@/shared/services-contract";
import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { ToolComponent } from "../tool-component";

type Inputs = ServiceToolInput<"aquarium-heater-size">;

/** Common commercial heater wattages. */
const SIZES = [25, 50, 75, 100, 150, 200, 250, 300];

const AquariumHeaterSizeTool: ToolComponent<"aquarium-heater-size"> = ({
  initialInputs,
  onInputsChange,
}) => {
  const { t } = useTranslation();
  const [tankLiters, setTankLiters] = React.useState<number | null>(
    initialInputs?.tankLiters ?? null,
  );
  const [roomTempC, setRoomTempC] = React.useState<number | null>(
    initialInputs?.roomTempC ?? null,
  );
  const [targetTempC, setTargetTempC] = React.useState<number | null>(
    initialInputs?.targetTempC ?? null,
  );

  const complete: Inputs | null =
    tankLiters != null &&
    tankLiters > 0 &&
    roomTempC != null &&
    roomTempC >= -10 &&
    roomTempC <= 40 &&
    targetTempC != null &&
    targetTempC >= 15 &&
    targetTempC <= 35
      ? { tankLiters, roomTempC, targetTempC }
      : null;
  const debounced = useDebounce(complete, 600);
  React.useEffect(() => {
    if (debounced) onInputsChange(debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const result = complete
    ? (() => {
        const delta = Math.max(0, complete.targetTempC - complete.roomTempC);
        // Hobbyist heuristic: ~0.5 W/L up to +5 °C, 1 W/L up to +10 °C, else 1.5 W/L.
        const wPerL = delta <= 5 ? 0.5 : delta <= 10 ? 1 : 1.5;
        const rawW = complete.tankLiters * wPerL;
        const suggested =
          SIZES.find((s) => s >= rawW) ?? Math.ceil(rawW / 50) * 50;
        const split = rawW > 150 || complete.tankLiters >= 200;
        return { delta, suggested, split };
      })()
    : null;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <ToolNumberField
        label={t("tools.aquariumHeaterSize.tankLiters")}
        value={tankLiters}
        onChangeValue={setTankLiters}
        unit="L"
        placeholder="0"
      />
      <Text style={styles.note}>
        {t("tools.aquariumHeaterSize.volumeHint")}
      </Text>
      <ToolNumberField
        label={t("tools.aquariumHeaterSize.roomTemp")}
        value={roomTempC}
        onChangeValue={setRoomTempC}
        unit="°C"
        placeholder="0"
      />
      <ToolNumberField
        label={t("tools.aquariumHeaterSize.targetTemp")}
        value={targetTempC}
        onChangeValue={setTargetTempC}
        unit="°C"
        placeholder="0"
      />

      {result ? (
        <ToolSection>
          <ToolResultCard
            label={t("tools.aquariumHeaterSize.delta")}
            value={String(Math.round(result.delta * 10) / 10)}
            unit="°C"
          />
          <ToolResultCard
            label={t("tools.aquariumHeaterSize.result")}
            value={String(result.suggested)}
            unit="W"
          />
          {result.split ? (
            <>
              <ToolResultCard
                label={t("tools.aquariumHeaterSize.split")}
                value={`2 × ${Math.ceil(result.suggested / 2 / 25) * 25}`}
                unit="W"
              />
              <Text style={styles.note}>
                {t("tools.aquariumHeaterSize.splitNote")}
              </Text>
            </>
          ) : null}
          <View style={styles.notes}>
            <Text style={styles.disclaimer}>
              {t("tools.aquariumHeaterSize.disclaimer")}
            </Text>
          </View>
        </ToolSection>
      ) : null}
    </ScrollView>
  );
};

export default AquariumHeaterSizeTool;

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

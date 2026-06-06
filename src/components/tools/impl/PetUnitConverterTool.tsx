import {
  ToolNumberField,
  ToolResultCard,
  ToolSection,
  ToolUnitToggle,
} from "@/components/tools/ui";
import type { ServiceToolInput } from "@/shared/services-contract";
import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { ToolComponent } from "../tool-component";

type Group = ServiceToolInput<"pet-unit-converter">["group"];

const FACTORS: Record<Exclude<Group, "TEMPERATURE">, Record<string, number>> = {
  WEIGHT: { kg: 1000, g: 1, lb: 453.592, oz: 28.3495 }, // base: g
  LENGTH: { cm: 10, mm: 1, m: 1000, in: 25.4, ft: 304.8 }, // base: mm
  VOLUME: { L: 1000, mL: 1, gal: 3785.41, floz: 29.5735 }, // base: mL
};
const UNITS: Record<Group, string[]> = {
  WEIGHT: ["kg", "g", "lb", "oz"],
  LENGTH: ["cm", "mm", "m", "in", "ft"],
  TEMPERATURE: ["°C", "°F"],
  VOLUME: ["L", "mL", "gal", "floz"],
};

function convert(group: Group, value: number, from: string, to: string): number {
  if (group === "TEMPERATURE") {
    const celsius = from === "°C" ? value : ((value - 32) * 5) / 9;
    return to === "°C" ? celsius : (celsius * 9) / 5 + 32;
  }
  const f = FACTORS[group];
  return (value * f[from]) / f[to];
}

function trim(n: number): string {
  return Number.isFinite(n) ? String(Math.round(n * 1000) / 1000) : "—";
}

const PetUnitConverterTool: ToolComponent<"pet-unit-converter"> = () => {
  const { t } = useTranslation();
  const [group, setGroup] = React.useState<Group>("WEIGHT");
  const [value, setValue] = React.useState<number | null>(null);
  const [fromUnit, setFromUnit] = React.useState<string>(UNITS.WEIGHT[0]);
  const [toUnit, setToUnit] = React.useState<string>(UNITS.WEIGHT[1]);

  const onGroupChange = (g: Group): void => {
    setGroup(g);
    setFromUnit(UNITS[g][0]);
    setToUnit(UNITS[g][1]);
  };

  const result =
    value != null ? convert(group, value, fromUnit, toUnit) : null;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <ToolUnitToggle<Group>
        options={[
          { value: "WEIGHT", label: t("tools.unitConverter.weight") },
          { value: "LENGTH", label: t("tools.unitConverter.length") },
          { value: "TEMPERATURE", label: t("tools.unitConverter.temperature") },
          { value: "VOLUME", label: t("tools.unitConverter.volume") },
        ]}
        value={group}
        onChange={onGroupChange}
      />

      <ToolNumberField
        label={t("tools.unitConverter.value")}
        value={value}
        onChangeValue={setValue}
        unit={fromUnit}
        placeholder="0"
      />

      <ToolSection label={t("tools.unitConverter.from")}>
        <ToolUnitToggle
          options={UNITS[group].map((u) => ({ value: u, label: u }))}
          value={fromUnit}
          onChange={setFromUnit}
        />
      </ToolSection>
      <ToolSection label={t("tools.unitConverter.to")}>
        <ToolUnitToggle
          options={UNITS[group].map((u) => ({ value: u, label: u }))}
          value={toUnit}
          onChange={setToUnit}
        />
      </ToolSection>

      {result != null ? (
        <ToolResultCard
          label={t("tools.unitConverter.result")}
          value={trim(result)}
          unit={toUnit}
        />
      ) : null}
    </ScrollView>
  );
};

export default PetUnitConverterTool;

const styles = StyleSheet.create((theme) => ({
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    paddingBottom: theme.spacing["4xl"],
  },
}));

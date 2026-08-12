import { ToolNumberField, ToolResultCard, ToolSection, ToolUnitToggle } from "@/components/tools/ui";
import { QueryBoundary } from "@/components/ui/QueryBoundary";
import { useDebounce } from "@/hooks/useDebounce";
import { careKnowledgeApi } from "@/services/care-knowledge.api";
import type { ServiceToolInput } from "@/shared/services-contract";
import type { ChickenCoopConfig } from "@/types/care-knowledge.types";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { ToolComponent } from "../tool-component";

type Inputs = ServiceToolInput<"chicken-coop-calculator">;
type SizeClass = Inputs["sizeClass"];

const ChickenCoopCalculatorTool: ToolComponent<"chicken-coop-calculator"> = ({
  initialInputs,
  onInputsChange,
}) => {
  const { t } = useTranslation();
  const [henCount, setHenCount] = React.useState<number | null>(
    initialInputs?.henCount ?? 4,
  );
  const [sizeClass, setSizeClass] = React.useState<SizeClass>(
    initialInputs?.sizeClass ?? "STANDARD",
  );

  const hens = henCount != null && henCount >= 1 ? Math.round(henCount) : null;

  const complete: Inputs | null =
    hens != null ? { henCount: hens, sizeClass } : null;
  const debounced = useDebounce(complete, 600);
  React.useEffect(() => {
    if (debounced) onInputsChange(debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(debounced)]);

  const query = useQuery({
    queryKey: ["care-knowledge", "chicken-coop"],
    queryFn: () => careKnowledgeApi.chickenCoop().then((r) => r.data),
  });

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <ToolNumberField
        label={t("tools.chickenCoopCalculator.henCount")}
        value={henCount}
        onChangeValue={setHenCount}
        placeholder="0"
      />
      <ToolSection label={t("tools.chickenCoopCalculator.sizeClass")}>
        <ToolUnitToggle<SizeClass>
          options={[
            { value: "BANTAM", label: t("tools.chickenCoopCalculator.bantam") },
            {
              value: "STANDARD",
              label: t("tools.chickenCoopCalculator.standard"),
            },
            { value: "HEAVY", label: t("tools.chickenCoopCalculator.heavy") },
          ]}
          value={sizeClass}
          onChange={setSizeClass}
        />
      </ToolSection>

      <QueryBoundary query={query}>
        {(g: ChickenCoopConfig) => {
          if (hens == null) return <></>;
          const f = g.sizeFactors[sizeClass];
          const floorM2 = (hens * g.floorM2PerHen * f).toFixed(1);
          const runM2 = (hens * g.runM2PerHen * f).toFixed(1);
          const nestBoxes = Math.max(1, Math.ceil(hens / g.hensPerNestBox));
          const roostCm = Math.round(hens * g.roostCmPerHen * f);
          return (
            <ToolSection>
              <ToolResultCard
                label={t("tools.chickenCoopCalculator.floor")}
                value={floorM2}
                unit="m²"
              />
              <ToolResultCard
                label={t("tools.chickenCoopCalculator.run")}
                value={runM2}
                unit="m²"
              />
              <ToolResultCard
                label={t("tools.chickenCoopCalculator.nestBoxes")}
                value={String(nestBoxes)}
              />
              <ToolResultCard
                label={t("tools.chickenCoopCalculator.roost")}
                value={String(roostCm)}
                unit="cm"
              />
              <View style={styles.notes}>
                {g.noteKeys.map((k) => (
                  <Text key={k} style={styles.note}>
                    • {t(k as never)}
                  </Text>
                ))}
                <Text style={styles.disclaimer}>
                  {t("tools.chickenCoopCalculator.disclaimer")}
                </Text>
              </View>
            </ToolSection>
          );
        }}
      </QueryBoundary>
    </ScrollView>
  );
};

export default ChickenCoopCalculatorTool;

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

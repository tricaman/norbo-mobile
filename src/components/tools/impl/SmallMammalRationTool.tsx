import { SmallMammalSpeciesPicker } from "@/components/tools/SmallMammalSpeciesPicker";
import { ToolNumberField, ToolResultCard, ToolSection, ToolUnitToggle } from "@/components/tools/ui";
import { QueryBoundary } from "@/components/ui/QueryBoundary";
import { ageMonthsFrom, matchSmallMammalSpecies, useSmallMammals } from "@/hooks/useDogs";
import { useDebounce } from "@/hooks/useDebounce";
import { useWeightHistory } from "@/hooks/useWeightHistory";
import { careKnowledgeApi } from "@/services/care-knowledge.api";
import type { ServiceToolInput } from "@/shared/services-contract";
import type { RationGuideline } from "@/types/care-knowledge.types";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { ToolComponent } from "../tool-component";

type Inputs = ServiceToolInput<"small-mammal-ration">;

const SmallMammalRationTool: ToolComponent<"small-mammal-ration"> = ({
  initialInputs,
  onInputsChange,
}) => {
  const { t } = useTranslation();
  const { smallMammals } = useSmallMammals();
  const [petId, setPetId] = React.useState<string | null>(null);
  const selected = smallMammals.find((p) => p.id === petId) ?? smallMammals[0] ?? null;

  const [species, setSpecies] = React.useState<string | null>(null);
  const effectiveSpecies =
    species ??
    initialInputs?.species ??
    matchSmallMammalSpecies(selected?.speciesLabelFreetext ?? null);

  const { latest } = useWeightHistory(selected?.id ?? "");
  const profileWeightKg =
    latest != null ? Math.round((latest.weightMg / 1_000_000) * 100) / 100 : null;
  const [weightKg, setWeightKg] = React.useState<number | null>(
    initialInputs?.weightKg ?? null,
  );
  const seededFor = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (weightKg == null && profileWeightKg != null && seededFor.current !== (selected?.id ?? null)) {
      seededFor.current = selected?.id ?? null;
      setWeightKg(profileWeightKg);
    }
  }, [profileWeightKg, selected?.id, weightKg]);

  const ageMonths = ageMonthsFrom(selected?.birthDate ?? null) ?? 0;

  const complete: Inputs | null =
    weightKg != null && weightKg > 0
      ? { species: effectiveSpecies, weightKg, ageMonths }
      : null;
  const debounced = useDebounce(complete, 600);
  React.useEffect(() => {
    if (debounced) onInputsChange(debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(debounced)]);

  const query = useQuery({
    queryKey: ["care-knowledge", "small-mammal-ration", effectiveSpecies],
    queryFn: () =>
      careKnowledgeApi.smallMammalRation(effectiveSpecies).then((r) => r.data),
  });

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <SmallMammalSpeciesPicker value={effectiveSpecies} onChange={setSpecies} />

      {smallMammals.length > 1 ? (
        <ToolUnitToggle<string>
          options={smallMammals.map((p) => ({ value: p.id, label: p.name }))}
          value={selected?.id ?? ""}
          onChange={(id) => {
            setPetId(id);
            seededFor.current = null;
            setWeightKg(null);
          }}
        />
      ) : null}

      <ToolNumberField
        label={t("tools.smallMammalRation.weight")}
        value={weightKg}
        onChangeValue={setWeightKg}
        unit="kg"
        placeholder="0"
      />

      <QueryBoundary query={query}>
        {(r: RationGuideline) => {
          if (weightKg == null || weightKg <= 0) return <></>;
          const pelletG = Math.round(r.pelletGramsPerKg * weightKg);
          const vegG = Math.round(r.vegGramsPerKg * weightKg);
          return (
            <ToolSection label={t("tools.smallMammalRation.result")}>
              <ToolResultCard
                label={t("tools.smallMammalRation.hay")}
                value={t(r.hayKey as never)}
              />
              {r.pelletGramsPerKg > 0 ? (
                <ToolResultCard
                  label={t("tools.smallMammalRation.pellet")}
                  value={String(pelletG)}
                  unit="g"
                />
              ) : null}
              {r.vegGramsPerKg > 0 ? (
                <ToolResultCard
                  label={t("tools.smallMammalRation.veg")}
                  value={String(vegG)}
                  unit="g"
                />
              ) : null}
              <View style={styles.notes}>
                {r.noteKeys.map((k) => (
                  <Text key={k} style={styles.note}>
                    • {t(k as never)}
                  </Text>
                ))}
                <Text style={styles.disclaimer}>
                  {t("tools.smallMammalRation.disclaimer")}
                </Text>
              </View>
            </ToolSection>
          );
        }}
      </QueryBoundary>
    </ScrollView>
  );
};

export default SmallMammalRationTool;

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

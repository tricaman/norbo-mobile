import { ToolSpeciesChips } from "@/components/tools/ToolSpeciesChips";
import { ToolNumberField, ToolResultCard, ToolSection, ToolUnitToggle } from "@/components/tools/ui";
import { QueryBoundary } from "@/components/ui/QueryBoundary";
import {
  LIVESTOCK_WATER_SPECIES,
  matchLivestockSpecies,
  useEquines,
  useFarmAnimals,
} from "@/hooks/useDogs";
import { useDebounce } from "@/hooks/useDebounce";
import { useWeightHistory } from "@/hooks/useWeightHistory";
import { careKnowledgeApi } from "@/services/care-knowledge.api";
import type { ServiceToolInput } from "@/shared/services-contract";
import type { WaterGuideline } from "@/types/care-knowledge.types";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { ToolComponent } from "../tool-component";

type Inputs = ServiceToolInput<"livestock-water-needs">;

/** Litres: 1 decimal below 10, integers above. */
const formatLitres = (v: number): string =>
  v < 10 ? v.toFixed(1) : String(Math.round(v));

const LivestockWaterNeedsTool: ToolComponent<"livestock-water-needs"> = ({
  initialInputs,
  onInputsChange,
}) => {
  const { t } = useTranslation();
  const { farmAnimals } = useFarmAnimals();
  const { equines } = useEquines();
  const animals = [...farmAnimals, ...equines];
  const [petId, setPetId] = React.useState<string | null>(null);
  const selected = animals.find((p) => p.id === petId) ?? animals[0] ?? null;

  const [species, setSpecies] = React.useState<string | null>(null);
  const effectiveSpecies =
    species ??
    initialInputs?.species ??
    matchLivestockSpecies(selected?.speciesLabelFreetext ?? null);

  const { latest } = useWeightHistory(selected?.id ?? "");
  const profileWeightKg =
    latest != null ? Math.round((latest.weightMg / 1_000_000) * 100) / 100 : null;
  const [weightKg, setWeightKg] = React.useState<number | null>(
    initialInputs?.weightKg ?? null,
  );
  const [headCount, setHeadCount] = React.useState<number | null>(
    initialInputs?.headCount ?? 1,
  );
  const seededFor = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (weightKg == null && profileWeightKg != null && seededFor.current !== (selected?.id ?? null)) {
      seededFor.current = selected?.id ?? null;
      setWeightKg(profileWeightKg);
    }
  }, [profileWeightKg, selected?.id, weightKg]);

  const query = useQuery({
    queryKey: ["care-knowledge", "livestock-water", effectiveSpecies],
    queryFn: () =>
      careKnowledgeApi.livestockWater(effectiveSpecies).then((r) => r.data),
  });
  const basis = query.data?.basis ?? null;

  const heads =
    headCount != null && headCount >= 1 ? Math.round(headCount) : null;

  // Only the field the current basis requires is persisted — a restored
  // initialInputs field from the other basis is ignored gracefully.
  const complete: Inputs | null =
    basis === "PER_KG"
      ? weightKg != null && weightKg > 0
        ? { species: effectiveSpecies, weightKg }
        : null
      : basis === "PER_HEAD"
        ? heads != null
          ? { species: effectiveSpecies, headCount: heads }
          : null
        : null;
  const debounced = useDebounce(complete, 600);
  React.useEffect(() => {
    if (debounced) onInputsChange(debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(debounced)]);

  const speciesOptions = [
    ...LIVESTOCK_WATER_SPECIES.map((id) => ({
      value: id as string,
      label: t(`tools.farm.species.${id}` as never) as string,
    })),
    { value: "generic", label: t("tools.farm.species.generic") },
  ];

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <ToolSpeciesChips
        options={speciesOptions}
        value={effectiveSpecies}
        onChange={setSpecies}
      />

      {animals.length > 1 ? (
        <ToolUnitToggle<string>
          options={animals.map((p) => ({ value: p.id, label: p.name }))}
          value={selected?.id ?? ""}
          onChange={(id) => {
            setPetId(id);
            seededFor.current = null;
            setWeightKg(null);
          }}
        />
      ) : null}

      <QueryBoundary query={query}>
        {(g: WaterGuideline) => {
          const units = g.basis === "PER_KG" ? weightKg : heads;
          const valid =
            g.basis === "PER_KG"
              ? weightKg != null && weightKg > 0
              : heads != null;
          return (
            <>
              {g.basis === "PER_KG" ? (
                <ToolNumberField
                  label={t("tools.livestockWaterNeeds.weight")}
                  value={weightKg}
                  onChangeValue={setWeightKg}
                  unit="kg"
                  placeholder="0"
                />
              ) : (
                <ToolNumberField
                  label={t(
                    effectiveSpecies === "chicken-flock"
                      ? "tools.livestockWaterNeeds.birdCount"
                      : "tools.livestockWaterNeeds.headCount",
                  )}
                  value={headCount}
                  onChangeValue={setHeadCount}
                  placeholder="1"
                />
              )}

              {valid && units != null ? (
                <ToolSection>
                  <ToolResultCard
                    label={t("tools.livestockWaterNeeds.result")}
                    value={`${formatLitres(units * g.minPerUnit)}–${formatLitres(units * g.maxPerUnit)}`}
                    unit={t("tools.livestockWaterNeeds.perDay")}
                  />
                  <View style={styles.notes}>
                    {g.noteKeys.map((k) => (
                      <Text key={k} style={styles.note}>
                        • {t(k as never)}
                      </Text>
                    ))}
                    <Text style={styles.disclaimer}>
                      {t("tools.livestockWaterNeeds.disclaimer")}
                    </Text>
                  </View>
                </ToolSection>
              ) : null}
            </>
          );
        }}
      </QueryBoundary>
    </ScrollView>
  );
};

export default LivestockWaterNeedsTool;

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

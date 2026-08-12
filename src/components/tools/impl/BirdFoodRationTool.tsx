import { ToolSpeciesChips } from "@/components/tools/ToolSpeciesChips";
import { ToolNumberField, ToolResultCard, ToolSection, ToolUnitToggle } from "@/components/tools/ui";
import { QueryBoundary } from "@/components/ui/QueryBoundary";
import { BIRD_SPECIES_GROUPS, matchBirdSpeciesGroup, useBirds } from "@/hooks/useDogs";
import { useDebounce } from "@/hooks/useDebounce";
import { useWeightHistory } from "@/hooks/useWeightHistory";
import { careKnowledgeApi } from "@/services/care-knowledge.api";
import type { ServiceToolInput } from "@/shared/services-contract";
import type { BirdFeedingGuideline } from "@/types/care-knowledge.types";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { ToolComponent } from "../tool-component";

type Inputs = ServiceToolInput<"bird-food-ration">;

const BirdFoodRationTool: ToolComponent<"bird-food-ration"> = ({
  initialInputs,
  onInputsChange,
}) => {
  const { t } = useTranslation();
  const { birds } = useBirds();
  const [petId, setPetId] = React.useState<string | null>(null);
  const selected = birds.find((p) => p.id === petId) ?? birds[0] ?? null;

  const [species, setSpecies] = React.useState<string | null>(null);
  const effectiveSpecies =
    species ??
    initialInputs?.species ??
    matchBirdSpeciesGroup(selected?.speciesLabelFreetext ?? null);

  const { latest } = useWeightHistory(selected?.id ?? "");
  // Bird weights are recorded in grams (weightMg / 1000).
  const profileWeightG =
    latest != null ? Math.round(latest.weightMg / 1000) : null;
  const [weightG, setWeightG] = React.useState<number | null>(
    initialInputs?.weightG ?? null,
  );
  const seededFor = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (weightG == null && profileWeightG != null && seededFor.current !== (selected?.id ?? null)) {
      seededFor.current = selected?.id ?? null;
      setWeightG(profileWeightG);
    }
  }, [profileWeightG, selected?.id, weightG]);

  const complete: Inputs | null =
    weightG != null && weightG > 0
      ? { species: effectiveSpecies, weightG }
      : null;
  const debounced = useDebounce(complete, 600);
  React.useEffect(() => {
    if (debounced) onInputsChange(debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(debounced)]);

  const query = useQuery({
    queryKey: ["care-knowledge", "bird-feeding", effectiveSpecies],
    queryFn: () =>
      careKnowledgeApi.birdFeeding(effectiveSpecies).then((r) => r.data),
  });

  const speciesOptions = [
    ...BIRD_SPECIES_GROUPS.map((id) => ({
      value: id as string,
      label: t(`tools.bird.species.${id}` as never) as string,
    })),
    { value: "generic", label: t("tools.bird.species.generic") },
  ];

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <ToolSpeciesChips
        options={speciesOptions}
        value={effectiveSpecies}
        onChange={setSpecies}
      />

      {birds.length > 1 ? (
        <ToolUnitToggle<string>
          options={birds.map((p) => ({ value: p.id, label: p.name }))}
          value={selected?.id ?? ""}
          onChange={(id) => {
            setPetId(id);
            seededFor.current = null;
            setWeightG(null);
          }}
        />
      ) : null}

      <ToolNumberField
        label={t("tools.birdFoodRation.weight")}
        value={weightG}
        onChangeValue={setWeightG}
        unit="g"
        placeholder="0"
      />

      <QueryBoundary query={query}>
        {(g: BirdFeedingGuideline) => {
          if (weightG == null || weightG <= 0) return <></>;
          const dryG = Math.round((weightG * g.dryFoodGramsPer100g) / 100);
          const outOfRange =
            weightG < g.typicalWeightG.min || weightG > g.typicalWeightG.max;
          return (
            <ToolSection>
              {outOfRange ? (
                <Text style={styles.hint}>
                  {t("tools.birdFoodRation.weightHint", {
                    min: String(g.typicalWeightG.min),
                    max: String(g.typicalWeightG.max),
                  })}
                </Text>
              ) : null}
              <ToolResultCard
                label={t("tools.birdFoodRation.dryFood")}
                value={String(dryG)}
                unit="g"
              />
              <ToolResultCard
                label={t("tools.birdFoodRation.freshVeg")}
                value={`${g.freshVegPct.min}–${g.freshVegPct.max}`}
                unit="%"
              />
              <ToolResultCard
                label={t("tools.birdFoodRation.diet")}
                value={t(g.dietKey as never)}
              />
              <View style={styles.notes}>
                {g.noteKeys.map((k) => (
                  <Text key={k} style={styles.note}>
                    • {t(k as never)}
                  </Text>
                ))}
                <Text style={styles.disclaimer}>
                  {t("tools.birdFoodRation.disclaimer")}
                </Text>
              </View>
            </ToolSection>
          );
        }}
      </QueryBoundary>
    </ScrollView>
  );
};

export default BirdFoodRationTool;

const styles = StyleSheet.create((theme) => ({
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    paddingBottom: theme.spacing["4xl"],
  },
  hint: { ...theme.typography.footnote, color: theme.colors.textSecondary },
  notes: { gap: theme.spacing.xs },
  note: { ...theme.typography.footnote, color: theme.colors.textSecondary },
  disclaimer: { ...theme.typography.caption, color: theme.colors.textTertiary },
}));

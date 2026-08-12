import { ToolSpeciesChips } from "@/components/tools/ToolSpeciesChips";
import { ToolNumberField, ToolResultCard, ToolSection } from "@/components/tools/ui";
import { QueryBoundary } from "@/components/ui/QueryBoundary";
import { BIRD_SPECIES_GROUPS, matchBirdSpeciesGroup, useBirds } from "@/hooks/useDogs";
import { useDebounce } from "@/hooks/useDebounce";
import { careKnowledgeApi } from "@/services/care-knowledge.api";
import type { ServiceToolInput } from "@/shared/services-contract";
import type { BirdHousingGuideline } from "@/types/care-knowledge.types";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { ToolComponent } from "../tool-component";

type Inputs = ServiceToolInput<"bird-cage-size">;

const BirdCageSizeTool: ToolComponent<"bird-cage-size"> = ({
  initialInputs,
  onInputsChange,
}) => {
  const { t } = useTranslation();
  const { birds, isPending } = useBirds();

  const [species, setSpecies] = React.useState<string | null>(null);
  const effectiveSpecies =
    species ??
    initialInputs?.species ??
    matchBirdSpeciesGroup(birds[0]?.speciesLabelFreetext ?? null);

  const [count, setCount] = React.useState<number | null>(
    initialInputs?.count ?? null,
  );
  const seededCount = React.useRef(false);
  React.useEffect(() => {
    if (count == null && !seededCount.current && !isPending) {
      seededCount.current = true;
      setCount(birds.length > 0 ? birds.length : 1);
    }
  }, [birds.length, count, isPending]);

  const complete: Inputs | null =
    count != null && count >= 1
      ? { species: effectiveSpecies, count: Math.round(count) }
      : null;
  const debounced = useDebounce(complete, 600);
  React.useEffect(() => {
    if (debounced) onInputsChange(debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(debounced)]);

  const query = useQuery({
    queryKey: ["care-knowledge", "bird-housing", effectiveSpecies],
    queryFn: () =>
      careKnowledgeApi.birdHousing(effectiveSpecies).then((r) => r.data),
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

      <ToolNumberField
        label={t("tools.birdCageSize.count")}
        value={count}
        onChangeValue={setCount}
        placeholder="1"
      />

      <QueryBoundary query={query}>
        {(g: BirdHousingGuideline) => {
          if (count == null || count < 1) return <></>;
          const widthCm =
            g.minWidthCm +
            Math.max(0, Math.round(count) - g.baseBirds) * g.extraWidthPerBirdCm;
          return (
            <ToolSection>
              <ToolResultCard
                label={t("tools.birdCageSize.dimensions")}
                value={`${widthCm}×${g.minDepthCm}×${g.minHeightCm}`}
                unit="cm"
              />
              <ToolResultCard
                label={t("tools.birdCageSize.barSpacing")}
                value={`${g.barSpacingMm.min}–${g.barSpacingMm.max}`}
                unit="mm"
              />
              <View style={styles.notes}>
                {g.noteKeys.map((k) => (
                  <Text key={k} style={styles.note}>
                    • {t(k as never)}
                  </Text>
                ))}
                <Text style={styles.disclaimer}>
                  {t("tools.birdCageSize.disclaimer")}
                </Text>
              </View>
            </ToolSection>
          );
        }}
      </QueryBoundary>
    </ScrollView>
  );
};

export default BirdCageSizeTool;

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

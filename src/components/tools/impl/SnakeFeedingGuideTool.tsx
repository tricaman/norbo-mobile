import { ToolSpeciesChips } from "@/components/tools/ToolSpeciesChips";
import { ToolNumberField, ToolResultCard, ToolSection, ToolUnitToggle } from "@/components/tools/ui";
import { QueryBoundary } from "@/components/ui/QueryBoundary";
import { ageMonthsFrom, matchSnakeSpecies, SNAKE_SPECIES, useReptiles } from "@/hooks/useDogs";
import { useDebounce } from "@/hooks/useDebounce";
import { useWeightHistory } from "@/hooks/useWeightHistory";
import { careKnowledgeApi } from "@/services/care-knowledge.api";
import type { ServiceToolInput } from "@/shared/services-contract";
import type { SnakeFeedingGuideline } from "@/types/care-knowledge.types";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { ToolComponent } from "../tool-component";

type Inputs = ServiceToolInput<"snake-feeding-guide">;
type AgeBand = Inputs["ageBand"];

const AGE_BANDS: readonly AgeBand[] = ["HATCHLING", "JUVENILE", "ADULT"];

/** Default age band from the pet's age in months (null → ADULT). */
function bandFromAgeMonths(ageMonths: number | null): AgeBand {
  if (ageMonths == null) return "ADULT";
  if (ageMonths < 6) return "HATCHLING";
  if (ageMonths < 36) return "JUVENILE";
  return "ADULT";
}

const SnakeFeedingGuideTool: ToolComponent<"snake-feeding-guide"> = ({
  initialInputs,
  onInputsChange,
}) => {
  const { t } = useTranslation();
  const { reptiles } = useReptiles();
  const [petId, setPetId] = React.useState<string | null>(null);
  const selected = reptiles.find((p) => p.id === petId) ?? reptiles[0] ?? null;

  const [species, setSpecies] = React.useState<string | null>(null);
  const effectiveSpecies =
    species ??
    initialInputs?.species ??
    matchSnakeSpecies(selected?.speciesLabelFreetext ?? null);

  const [ageBand, setAgeBand] = React.useState<AgeBand | null>(null);
  const effectiveAgeBand: AgeBand =
    ageBand ??
    initialInputs?.ageBand ??
    bandFromAgeMonths(ageMonthsFrom(selected?.birthDate ?? null));

  const { latest } = useWeightHistory(selected?.id ?? "");
  const profileWeightG = latest != null ? Math.round(latest.weightMg / 1000) : null;
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

  const complete: Inputs | null = {
    species: effectiveSpecies,
    ageBand: effectiveAgeBand,
    ...(weightG != null && weightG > 0 ? { weightG } : {}),
  };
  const debounced = useDebounce(complete, 600);
  React.useEffect(() => {
    if (debounced) onInputsChange(debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(debounced)]);

  const query = useQuery({
    queryKey: ["care-knowledge", "snake-feeding", effectiveSpecies],
    queryFn: () =>
      careKnowledgeApi.snakeFeeding(effectiveSpecies).then((r) => r.data),
  });

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <ToolSpeciesChips
        options={[
          ...SNAKE_SPECIES.map((s) => ({
            value: s,
            label: t(`tools.snakeFeedingGuide.species.${s}` as never) as string,
          })),
          {
            value: "generic",
            label: t("tools.snakeFeedingGuide.species.generic"),
          },
        ]}
        value={effectiveSpecies}
        onChange={setSpecies}
      />

      {reptiles.length > 1 ? (
        <ToolUnitToggle<string>
          options={reptiles.map((p) => ({ value: p.id, label: p.name }))}
          value={selected?.id ?? ""}
          onChange={(id) => {
            setPetId(id);
            seededFor.current = null;
            setWeightG(null);
          }}
        />
      ) : null}

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>{t("tools.snakeFeedingGuide.age")}</Text>
        <ToolUnitToggle<AgeBand>
          options={AGE_BANDS.map((b) => ({
            value: b,
            label: t(`tools.snakeFeedingGuide.ageBand.${b}` as never) as string,
          }))}
          value={effectiveAgeBand}
          onChange={setAgeBand}
        />
      </View>

      <ToolNumberField
        label={t("tools.snakeFeedingGuide.weight")}
        value={weightG}
        onChangeValue={setWeightG}
        unit="g"
        placeholder="0"
      />

      <QueryBoundary query={query}>
        {(g: SnakeFeedingGuideline) => {
          const band = g.bands.find((b) => b.ageBand === effectiveAgeBand);
          if (!band) return <></>;
          return (
            <ToolSection>
              <ToolResultCard
                label={t("tools.snakeFeedingGuide.preyType")}
                value={t(band.preyTypeKey as never)}
              />
              <View style={styles.noteBlock}>
                <Text style={styles.noteLabel}>
                  {t("tools.snakeFeedingGuide.preySize")}
                </Text>
                <Text style={styles.note}>{t(g.girthRuleKey as never)}</Text>
              </View>
              <ToolResultCard
                label={t("tools.snakeFeedingGuide.interval")}
                value={`${band.intervalDays.min}–${band.intervalDays.max}`}
                unit={t("tools.snakeFeedingGuide.intervalUnit")}
              />
              {weightG != null && weightG > 0 && band.preyPctBodyWeight.max > 0 ? (
                <ToolResultCard
                  label={t("tools.snakeFeedingGuide.preyWeight")}
                  value={`${Math.round((weightG * band.preyPctBodyWeight.min) / 100)}–${Math.round((weightG * band.preyPctBodyWeight.max) / 100)}`}
                  unit="g"
                />
              ) : null}
              <View style={styles.notes}>
                {g.noteKeys.map((k) => (
                  <Text key={k} style={styles.note}>
                    • {t(k as never)}
                  </Text>
                ))}
                <Text style={styles.disclaimer}>
                  {t("tools.snakeFeedingGuide.disclaimer")}
                </Text>
              </View>
            </ToolSection>
          );
        }}
      </QueryBoundary>
    </ScrollView>
  );
};

export default SnakeFeedingGuideTool;

const styles = StyleSheet.create((theme) => ({
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    paddingBottom: theme.spacing["4xl"],
  },
  field: { gap: theme.spacing.xs },
  fieldLabel: {
    ...theme.typography.footnote,
    color: theme.colors.primary,
    textTransform: "lowercase",
    letterSpacing: 0.8,
  },
  noteBlock: { gap: theme.spacing.xs },
  noteLabel: {
    ...theme.typography.footnote,
    color: theme.colors.primary,
    textTransform: "lowercase",
    letterSpacing: 1,
  },
  notes: { gap: theme.spacing.xs },
  note: { ...theme.typography.footnote, color: theme.colors.textSecondary },
  disclaimer: { ...theme.typography.caption, color: theme.colors.textTertiary },
}));

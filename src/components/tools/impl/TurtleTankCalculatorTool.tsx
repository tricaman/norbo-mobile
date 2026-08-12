import { ToolSpeciesChips } from "@/components/tools/ToolSpeciesChips";
import { ToolNumberField, ToolResultCard, ToolSection, ToolUnitToggle } from "@/components/tools/ui";
import { QueryBoundary } from "@/components/ui/QueryBoundary";
import {
  matchTurtleSpecies,
  TORTOISE_HINT_ALIASES,
  TURTLE_SPECIES,
  useReptiles,
} from "@/hooks/useDogs";
import { useDebounce } from "@/hooks/useDebounce";
import { careKnowledgeApi } from "@/services/care-knowledge.api";
import type { ServiceToolInput } from "@/shared/services-contract";
import type { TurtleTankGuideline } from "@/types/care-knowledge.types";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { ToolComponent } from "../tool-component";

type Inputs = ServiceToolInput<"turtle-tank-calculator">;

const TurtleTankCalculatorTool: ToolComponent<"turtle-tank-calculator"> = ({
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
    matchTurtleSpecies(selected?.speciesLabelFreetext ?? null);

  const [shellLengthCm, setShellLengthCm] = React.useState<number | null>(
    initialInputs?.shellLengthCm ?? null,
  );
  const [count, setCount] = React.useState<number | null>(
    initialInputs?.count ?? 1,
  );

  const speciesHint = selected?.speciesLabelFreetext?.toLowerCase() ?? "";
  const looksLikeTortoise =
    speciesHint.length > 0 &&
    TORTOISE_HINT_ALIASES.some((a) => speciesHint.includes(a));

  const complete: Inputs | null =
    shellLengthCm != null && shellLengthCm > 0 && count != null && count >= 1
      ? { species: effectiveSpecies, shellLengthCm, count }
      : null;
  const debounced = useDebounce(complete, 600);
  React.useEffect(() => {
    if (debounced) onInputsChange(debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(debounced)]);

  const query = useQuery({
    queryKey: ["care-knowledge", "turtle-tank", effectiveSpecies],
    queryFn: () =>
      careKnowledgeApi.turtleTank(effectiveSpecies).then((r) => r.data),
  });

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {looksLikeTortoise ? (
        <Text style={styles.hint}>
          {t("tools.turtleTankCalculator.tortoiseHint")}
        </Text>
      ) : null}

      <ToolSpeciesChips
        options={[
          ...TURTLE_SPECIES.map((s) => ({
            value: s,
            label: t(`tools.turtleTankCalculator.species.${s}` as never) as string,
          })),
          {
            value: "generic",
            label: t("tools.turtleTankCalculator.species.generic"),
          },
        ]}
        value={effectiveSpecies}
        onChange={setSpecies}
      />

      {reptiles.length > 1 ? (
        <ToolUnitToggle<string>
          options={reptiles.map((p) => ({ value: p.id, label: p.name }))}
          value={selected?.id ?? ""}
          onChange={setPetId}
        />
      ) : null}

      <ToolNumberField
        label={t("tools.turtleTankCalculator.shellLength")}
        value={shellLengthCm}
        onChangeValue={setShellLengthCm}
        unit="cm"
        placeholder="0"
      />
      <ToolNumberField
        label={t("tools.turtleTankCalculator.count")}
        value={count}
        onChangeValue={(v) =>
          setCount(v == null ? null : Math.max(1, Math.round(v)))
        }
        placeholder="1"
      />

      <QueryBoundary query={query}>
        {(g: TurtleTankGuideline) => {
          if (shellLengthCm == null || shellLengthCm <= 0 || count == null || count < 1) {
            return <></>;
          }
          const liters = Math.round(
            shellLengthCm *
              (g.litersPerShellCm + (count - 1) * g.extraLitersPerShellCmPerTurtle),
          );
          const minDepthCm = Math.round(shellLengthCm * g.minWaterDepthFactor);
          return (
            <ToolSection>
              <ToolResultCard
                label={t("tools.turtleTankCalculator.tankVolume")}
                value={String(liters)}
                unit="L"
              />
              <ToolResultCard
                label={t("tools.turtleTankCalculator.waterDepth")}
                value={String(minDepthCm)}
                unit="cm"
              />
              <ToolResultCard
                label={t("tools.turtleTankCalculator.waterTemp")}
                value={`${g.waterTempC.min}–${g.waterTempC.max}`}
                unit="°C"
              />
              <ToolResultCard
                label={t("tools.turtleTankCalculator.baskingTemp")}
                value={`${g.baskingTempC.min}–${g.baskingTempC.max}`}
                unit="°C"
              />
              <View style={styles.noteBlock}>
                <Text style={styles.noteLabel}>
                  {t("tools.turtleTankCalculator.uvb")}
                </Text>
                <Text style={styles.note}>{t(g.uvbNoteKey as never)}</Text>
              </View>
              <View style={styles.notes}>
                {g.noteKeys.map((k) => (
                  <Text key={k} style={styles.note}>
                    • {t(k as never)}
                  </Text>
                ))}
                <Text style={styles.disclaimer}>
                  {t("tools.turtleTankCalculator.disclaimer")}
                </Text>
              </View>
            </ToolSection>
          );
        }}
      </QueryBoundary>
    </ScrollView>
  );
};

export default TurtleTankCalculatorTool;

const styles = StyleSheet.create((theme) => ({
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    paddingBottom: theme.spacing["4xl"],
  },
  hint: {
    ...theme.typography.footnote,
    color: theme.colors.textSecondary,
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    ...theme.card,
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

import { ConsumableReminderButton } from "@/components/tools/ConsumableReminderButton";
import { ToolSpeciesChips } from "@/components/tools/ToolSpeciesChips";
import { ToolNumberField, ToolResultCard, ToolSection, ToolUnitToggle } from "@/components/tools/ui";
import { QueryBoundary } from "@/components/ui/QueryBoundary";
import {
  FORAGE_SPECIES,
  matchForageSpecies,
  useEquines,
  useFarmAnimals,
} from "@/hooks/useDogs";
import { useDebounce } from "@/hooks/useDebounce";
import { useWeightHistory } from "@/hooks/useWeightHistory";
import { careKnowledgeApi } from "@/services/care-knowledge.api";
import type { ServiceToolInput } from "@/shared/services-contract";
import type { ForageGuideline } from "@/types/care-knowledge.types";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { ToolComponent } from "../tool-component";

type Inputs = ServiceToolInput<"forage-ration">;

const ForageRationTool: ToolComponent<"forage-ration"> = ({
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
    matchForageSpecies(selected?.speciesLabelFreetext ?? null);

  const { latest } = useWeightHistory(selected?.id ?? "");
  const profileWeightKg =
    latest != null ? Math.round((latest.weightMg / 1_000_000) * 100) / 100 : null;
  const [weightKg, setWeightKg] = React.useState<number | null>(
    initialInputs?.weightKg ?? null,
  );
  const [currentStockKg, setStock] = React.useState<number | null>(
    initialInputs?.currentStockKg ?? null,
  );
  const seededFor = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (weightKg == null && profileWeightKg != null && seededFor.current !== (selected?.id ?? null)) {
      seededFor.current = selected?.id ?? null;
      setWeightKg(profileWeightKg);
    }
  }, [profileWeightKg, selected?.id, weightKg]);

  const complete: Inputs | null =
    weightKg != null && weightKg > 0
      ? currentStockKg != null && currentStockKg > 0
        ? { species: effectiveSpecies, weightKg, currentStockKg }
        : { species: effectiveSpecies, weightKg }
      : null;
  const debounced = useDebounce(complete, 600);
  React.useEffect(() => {
    if (debounced) onInputsChange(debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(debounced)]);

  const query = useQuery({
    queryKey: ["care-knowledge", "forage-ration", effectiveSpecies],
    queryFn: () =>
      careKnowledgeApi.forageRation(effectiveSpecies).then((r) => r.data),
  });

  const speciesOptions = [
    ...FORAGE_SPECIES.map((id) => ({
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

      <ToolNumberField
        label={t("tools.forageRation.weight")}
        value={weightKg}
        onChangeValue={setWeightKg}
        unit="kg"
        placeholder="0"
      />
      <ToolNumberField
        label={t("tools.forageRation.currentStock")}
        value={currentStockKg}
        onChangeValue={setStock}
        unit="kg"
        placeholder="0"
      />

      <QueryBoundary query={query}>
        {(g: ForageGuideline) => {
          if (weightKg == null || weightKg <= 0) return <></>;
          const dailyMin = (weightKg * g.dmPercentMin) / 100;
          const dailyMax = (weightKg * g.dmPercentMax) / 100;
          const dailyMid =
            (weightKg * (g.dmPercentMin + g.dmPercentMax)) / 2 / 100;
          const daysLeft =
            currentStockKg != null && currentStockKg > 0 && dailyMid > 0
              ? Math.floor(currentStockKg / dailyMid)
              : null;
          const reorderDate =
            daysLeft != null
              ? new Date(Date.now() + daysLeft * 86400000)
              : null;
          return (
            <ToolSection>
              <ToolResultCard
                label={t("tools.forageRation.dailyRange")}
                value={`${dailyMin.toFixed(1)}–${dailyMax.toFixed(1)}`}
                unit="kg"
              />
              {daysLeft != null && reorderDate != null ? (
                <>
                  <ToolResultCard
                    label={t("tools.forageRation.daysLeft")}
                    value={String(daysLeft)}
                    unit={t("tools.forageRation.days")}
                  />
                  <ToolResultCard
                    label={t("tools.forageRation.reorderDate")}
                    value={reorderDate.toLocaleDateString()}
                  />
                  {selected ? (
                    <ConsumableReminderButton
                      petId={selected.id}
                      title={t("tools.forageRation.reminderTitle", {
                        name: selected.name,
                      })}
                      dueAt={reorderDate}
                    />
                  ) : null}
                </>
              ) : null}
              <View style={styles.notes}>
                {g.noteKeys.map((k) => (
                  <Text key={k} style={styles.note}>
                    • {t(k as never)}
                  </Text>
                ))}
                <Text style={styles.disclaimer}>
                  {t("tools.forageRation.disclaimer")}
                </Text>
              </View>
            </ToolSection>
          );
        }}
      </QueryBoundary>
    </ScrollView>
  );
};

export default ForageRationTool;

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

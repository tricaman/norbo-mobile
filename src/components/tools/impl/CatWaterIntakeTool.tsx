import { ToolNumberField, ToolResultCard, ToolSection, ToolUnitToggle } from "@/components/tools/ui";
import { QueryBoundary } from "@/components/ui/QueryBoundary";
import { useCats } from "@/hooks/useDogs";
import { useDebounce } from "@/hooks/useDebounce";
import { useWeightHistory } from "@/hooks/useWeightHistory";
import { careKnowledgeApi } from "@/services/care-knowledge.api";
import type { ServiceToolInput } from "@/shared/services-contract";
import type { CatFoodType, CatHydration } from "@/types/care-knowledge.types";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { ToolComponent } from "../tool-component";

type Inputs = ServiceToolInput<"cat-water-intake">;

const CatWaterIntakeTool: ToolComponent<"cat-water-intake"> = ({
  initialInputs,
  onInputsChange,
}) => {
  const { t } = useTranslation();
  const { cats } = useCats();
  const [catId, setCatId] = React.useState<string | null>(null);
  const selectedId = catId ?? cats[0]?.id ?? null;
  const { latest } = useWeightHistory(selectedId ?? "");
  const profileWeightKg =
    latest != null ? Math.round((latest.weightMg / 1_000_000) * 10) / 10 : null;

  const [weightKg, setWeightKg] = React.useState<number | null>(
    initialInputs?.weightKg ?? null,
  );
  const [foodType, setFoodType] = React.useState<CatFoodType>(
    initialInputs?.foodType ?? "DRY",
  );
  const seededFor = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (weightKg == null && profileWeightKg != null && seededFor.current !== selectedId) {
      seededFor.current = selectedId;
      setWeightKg(profileWeightKg);
    }
  }, [profileWeightKg, selectedId, weightKg]);

  const complete: Inputs | null =
    weightKg != null && weightKg > 0 ? { weightKg, foodType } : null;
  const debounced = useDebounce(complete, 600);
  React.useEffect(() => {
    if (debounced) onInputsChange(debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const query = useQuery({
    queryKey: ["care-knowledge", "cat-hydration"],
    queryFn: () => careKnowledgeApi.catHydration().then((r) => r.data),
  });

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {cats.length > 1 ? (
        <ToolUnitToggle<string>
          options={cats.map((c) => ({ value: c.id, label: c.name }))}
          value={selectedId ?? ""}
          onChange={(id) => {
            setCatId(id);
            seededFor.current = null;
            setWeightKg(null);
          }}
        />
      ) : null}

      <ToolNumberField
        label={t("tools.catWaterIntake.weight")}
        value={weightKg}
        onChangeValue={setWeightKg}
        unit="kg"
        placeholder="0"
      />
      <ToolSection label={t("tools.catWaterIntake.foodType")}>
        <ToolUnitToggle<CatFoodType>
          options={[
            { value: "DRY", label: t("tools.catWaterIntake.dry") },
            { value: "WET", label: t("tools.catWaterIntake.wet") },
            { value: "MIXED", label: t("tools.catWaterIntake.mixed") },
          ]}
          value={foodType}
          onChange={setFoodType}
        />
      </ToolSection>

      <QueryBoundary query={query}>
        {(h: CatHydration) => {
          if (weightKg == null || weightKg <= 0) return <></>;
          const total = Math.round(weightKg * h.mlPerKg);
          const free = Math.round(total * (1 - h.foodWaterFraction[foodType]));
          return (
            <ToolSection label={t("tools.catWaterIntake.result")}>
              <ToolResultCard
                label={t("tools.catWaterIntake.total")}
                value={String(total)}
                unit="ml"
              />
              <ToolResultCard
                label={t("tools.catWaterIntake.freeWater")}
                value={String(free)}
                unit="ml"
                caption={t("tools.catWaterIntake.disclaimer")}
              />
              <View style={styles.notes}>
                {h.noteKeys.map((k) => (
                  <Text key={k} style={styles.note}>
                    • {t(k as never)}
                  </Text>
                ))}
              </View>
            </ToolSection>
          );
        }}
      </QueryBoundary>
    </ScrollView>
  );
};

export default CatWaterIntakeTool;

const styles = StyleSheet.create((theme) => ({
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    paddingBottom: theme.spacing["4xl"],
  },
  notes: { gap: theme.spacing.xs, marginTop: theme.spacing.xs },
  note: { ...theme.typography.footnote, color: theme.colors.textSecondary },
}));

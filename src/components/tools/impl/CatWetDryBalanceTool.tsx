import { ToolNumberField, ToolResultCard, ToolSection, ToolUnitToggle } from "@/components/tools/ui";
import { QueryBoundary } from "@/components/ui/QueryBoundary";
import { useCats } from "@/hooks/useDogs";
import { useDebounce } from "@/hooks/useDebounce";
import { useWeightHistory } from "@/hooks/useWeightHistory";
import { careKnowledgeApi } from "@/services/care-knowledge.api";
import type { ServiceToolInput } from "@/shared/services-contract";
import type { CatFoodEnergy } from "@/types/care-knowledge.types";
import { dailyEnergyKcal } from "@/utils/energy";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { ToolComponent } from "../tool-component";

type Inputs = ServiceToolInput<"cat-wet-dry-balance">;

const CatWetDryBalanceTool: ToolComponent<"cat-wet-dry-balance"> = ({
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
  const [wetPercent, setWetPercent] = React.useState<number>(
    initialInputs?.wetPercent ?? 50,
  );
  const seededFor = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (weightKg == null && profileWeightKg != null && seededFor.current !== selectedId) {
      seededFor.current = selectedId;
      setWeightKg(profileWeightKg);
    }
  }, [profileWeightKg, selectedId, weightKg]);

  const complete: Inputs | null =
    weightKg != null && weightKg > 0 ? { weightKg, wetPercent } : null;
  const debounced = useDebounce(complete, 600);
  React.useEffect(() => {
    if (debounced) onInputsChange(debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const query = useQuery({
    queryKey: ["care-knowledge", "cat-food-energy"],
    queryFn: () => careKnowledgeApi.catFoodEnergy().then((r) => r.data),
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
        label={t("tools.catWetDryBalance.weight")}
        value={weightKg}
        onChangeValue={setWeightKg}
        unit="kg"
        placeholder="0"
      />
      <ToolNumberField
        label={t("tools.catWetDryBalance.wetPercent")}
        value={wetPercent}
        onChangeValue={(v) => setWetPercent(Math.max(0, Math.min(100, v ?? 0)))}
        unit="%"
        placeholder="50"
      />

      <QueryBoundary query={query}>
        {(energy: CatFoodEnergy) => {
          if (weightKg == null || weightKg <= 0) return <></>;
          const targetKcal = dailyEnergyKcal(weightKg, energy.maintenanceFactor);
          const wetKcal = (targetKcal * wetPercent) / 100;
          const dryKcal = targetKcal - wetKcal;
          const wetG = Math.round((wetKcal / energy.wetKcalPer100g) * 100);
          const dryG = Math.round((dryKcal / energy.dryKcalPer100g) * 100);
          return (
            <ToolSection label={t("tools.catWetDryBalance.result")}>
              <ToolResultCard
                label={t("tools.catWetDryBalance.target")}
                value={String(Math.round(targetKcal))}
                unit="kcal/day"
              />
              <ToolResultCard
                label={t("tools.catWetDryBalance.wetFood")}
                value={String(wetG)}
                unit="g"
              />
              <ToolResultCard
                label={t("tools.catWetDryBalance.dryFood")}
                value={String(dryG)}
                unit="g"
                caption={t("tools.catWetDryBalance.disclaimer")}
              />
            </ToolSection>
          );
        }}
      </QueryBoundary>
    </ScrollView>
  );
};

export default CatWetDryBalanceTool;

const styles = StyleSheet.create((theme) => ({
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    paddingBottom: theme.spacing["4xl"],
  },
}));

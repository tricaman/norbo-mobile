import { ConsumableReminderButton } from "@/components/tools/ConsumableReminderButton";
import { ToolNumberField, ToolResultCard, ToolSection, ToolUnitToggle } from "@/components/tools/ui";
import { QueryBoundary } from "@/components/ui/QueryBoundary";
import { useSmallMammals } from "@/hooks/useDogs";
import { useDebounce } from "@/hooks/useDebounce";
import { useWeightHistory } from "@/hooks/useWeightHistory";
import { careKnowledgeApi } from "@/services/care-knowledge.api";
import type { ServiceToolInput } from "@/shared/services-contract";
import type { HayConfig } from "@/types/care-knowledge.types";
import { useQuery } from "@tanstack/react-query";
import { addDays, format } from "date-fns";
import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { ToolComponent } from "../tool-component";

type Inputs = ServiceToolInput<"rabbit-hay-supply">;

const RabbitHaySupplyTool: ToolComponent<"rabbit-hay-supply"> = ({
  initialInputs,
  onInputsChange,
}) => {
  const { t } = useTranslation();
  const { smallMammals } = useSmallMammals();
  const [petId, setPetId] = React.useState<string | null>(null);
  const selected = smallMammals.find((p) => p.id === petId) ?? smallMammals[0] ?? null;

  const { latest } = useWeightHistory(selected?.id ?? "");
  const profileWeightKg =
    latest != null ? Math.round((latest.weightMg / 1_000_000) * 100) / 100 : null;
  const [weightKg, setWeightKg] = React.useState<number | null>(
    initialInputs?.weightKg ?? null,
  );
  const [currentStockG, setStock] = React.useState<number | null>(
    initialInputs?.currentStockG ?? null,
  );
  const seededFor = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (weightKg == null && profileWeightKg != null && seededFor.current !== (selected?.id ?? null)) {
      seededFor.current = selected?.id ?? null;
      setWeightKg(profileWeightKg);
    }
  }, [profileWeightKg, selected?.id, weightKg]);

  const complete: Inputs | null =
    weightKg != null && weightKg > 0 && currentStockG != null
      ? { weightKg, currentStockG }
      : null;
  const debounced = useDebounce(complete, 600);
  React.useEffect(() => {
    if (debounced) onInputsChange(debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const query = useQuery({
    queryKey: ["care-knowledge", "rabbit-hay"],
    queryFn: () => careKnowledgeApi.rabbitHay().then((r) => r.data),
  });

  return (
    <ScrollView contentContainerStyle={styles.content}>
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
        label={t("tools.rabbitHaySupply.weight")}
        value={weightKg}
        onChangeValue={setWeightKg}
        unit="kg"
        placeholder="0"
      />
      <ToolNumberField
        label={t("tools.rabbitHaySupply.currentStock")}
        value={currentStockG}
        onChangeValue={setStock}
        unit="g"
        placeholder="0"
      />

      <QueryBoundary query={query}>
        {(hay: HayConfig) => {
          if (weightKg == null || weightKg <= 0 || currentStockG == null) {
            return <></>;
          }
          const dailyNeed = weightKg * hay.gramsPerKgPerDay;
          const daysLeft = Math.floor(currentStockG / dailyNeed);
          const reorderDate = addDays(new Date(), daysLeft);
          return (
            <ToolSection label={t("tools.rabbitHaySupply.result")}>
              <ToolResultCard
                label={t("tools.rabbitHaySupply.daysLeft")}
                value={String(daysLeft)}
                unit={t("tools.rabbitHaySupply.days")}
              />
              <ToolResultCard
                label={t("tools.rabbitHaySupply.reorderDate")}
                value={format(reorderDate, "dd/MM/yyyy")}
                caption={t("tools.rabbitHaySupply.disclaimer")}
              />
              {selected ? (
                <ConsumableReminderButton
                  petId={selected.id}
                  title={t("tools.rabbitHaySupply.reminderTitle", {
                    name: selected.name,
                  })}
                  dueAt={reorderDate}
                />
              ) : null}
            </ToolSection>
          );
        }}
      </QueryBoundary>
    </ScrollView>
  );
};

export default RabbitHaySupplyTool;

const styles = StyleSheet.create((theme) => ({
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    paddingBottom: theme.spacing["4xl"],
  },
}));

import { AddPetBanner } from "@/components/tools/AddPetBanner";
import {
  ToolNumberField,
  ToolResultCard,
  ToolSection,
  ToolUnitToggle,
} from "@/components/tools/ui";
import { useDebounce } from "@/hooks/useDebounce";
import { petsApi } from "@/services/pets.api";
import { ExpenseCategory } from "@/shared/pet-event-schemas";
import type { ServiceToolInput } from "@/shared/services-contract";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { ToolComponent } from "../tool-component";

type Inputs = ServiceToolInput<"maintenance-cost">;
type Frequency = Inputs["items"][number]["frequency"];

const CATEGORIES = Object.values(ExpenseCategory);
const PER_MONTH: Record<Frequency, number> = {
  WEEK: 52 / 12,
  MONTH: 1,
  YEAR: 1 / 12,
};

interface Line {
  amount: number | null;
  frequency: Frequency;
}

const MaintenanceCostTool: ToolComponent<"maintenance-cost"> = ({
  initialInputs,
  onInputsChange,
}) => {
  const { t } = useTranslation();
  const petsQuery = useQuery({
    queryKey: ["pets"],
    queryFn: () => petsApi.list().then((r) => r.data),
  });
  const hasPets = (petsQuery.data?.length ?? 0) > 0;

  const [lines, setLines] = React.useState<Record<string, Line>>(() => {
    const seed: Record<string, Line> = {};
    for (const cat of CATEGORIES) seed[cat] = { amount: null, frequency: "MONTH" };
    for (const item of initialInputs?.items ?? []) {
      seed[item.category] = { amount: item.amount, frequency: item.frequency };
    }
    return seed;
  });

  const setLine = (cat: ExpenseCategory, patch: Partial<Line>): void =>
    setLines((prev) => ({ ...prev, [cat]: { ...prev[cat], ...patch } }));

  const items: Inputs["items"] = CATEGORIES.filter(
    (cat) => lines[cat].amount != null && lines[cat].amount! >= 0,
  ).map((cat) => ({
    category: cat,
    amount: lines[cat].amount as number,
    frequency: lines[cat].frequency,
  }));

  const debounced = useDebounce(items, 600);
  React.useEffect(() => {
    if (debounced.length > 0) onInputsChange({ items: debounced });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(debounced)]);

  const monthly = items.reduce(
    (sum, it) => sum + it.amount * PER_MONTH[it.frequency],
    0,
  );

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {!petsQuery.isPending && !hasPets ? <AddPetBanner /> : null}

      {CATEGORIES.map((cat) => (
        <ToolSection key={cat} label={t(`tools.maintenanceCost.cat.${cat}` as never)}>
          <ToolNumberField
            label={t("tools.maintenanceCost.amount")}
            value={lines[cat].amount}
            onChangeValue={(v) => setLine(cat, { amount: v })}
            unit="€"
            placeholder="0"
          />
          <ToolUnitToggle<Frequency>
            options={[
              { value: "WEEK", label: t("tools.maintenanceCost.week") },
              { value: "MONTH", label: t("tools.maintenanceCost.month") },
              { value: "YEAR", label: t("tools.maintenanceCost.year") },
            ]}
            value={lines[cat].frequency}
            onChange={(f) => setLine(cat, { frequency: f })}
          />
        </ToolSection>
      ))}

      {items.length > 0 ? (
        <>
          <ToolResultCard
            label={t("tools.maintenanceCost.monthly")}
            value={`€ ${monthly.toFixed(2)}`}
          />
          <ToolResultCard
            label={t("tools.maintenanceCost.yearly")}
            value={`€ ${(monthly * 12).toFixed(2)}`}
          />
        </>
      ) : null}
    </ScrollView>
  );
};

export default MaintenanceCostTool;

const styles = StyleSheet.create((theme) => ({
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    paddingBottom: theme.spacing["4xl"],
  },
}));

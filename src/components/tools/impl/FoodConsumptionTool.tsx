import { AddPetBanner } from "@/components/tools/AddPetBanner";
import { ConsumableReminderButton } from "@/components/tools/ConsumableReminderButton";
import {
  ToolNumberField,
  ToolResultCard,
  ToolSection,
} from "@/components/tools/ui";
import { useDebounce } from "@/hooks/useDebounce";
import { petsApi } from "@/services/pets.api";
import type { ServiceToolInput } from "@/shared/services-contract";
import { useQuery } from "@tanstack/react-query";
import { addDays, format } from "date-fns";
import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { ToolComponent } from "../tool-component";

type Inputs = ServiceToolInput<"food-consumption">;

const FoodConsumptionTool: ToolComponent<"food-consumption"> = ({
  pet,
  initialInputs,
  onInputsChange,
}) => {
  const { t } = useTranslation();
  const petsQuery = useQuery({
    queryKey: ["pets"],
    queryFn: () => petsApi.list().then((r) => r.data),
  });
  const hasPets = (petsQuery.data?.length ?? 0) > 0;

  const [packageWeightG, setPackage] = React.useState<number | null>(
    initialInputs?.packageWeightG ?? null,
  );
  const [dailyGramsG, setDaily] = React.useState<number | null>(
    initialInputs?.dailyGramsG ?? null,
  );
  const [currentStockG, setStock] = React.useState<number | null>(
    initialInputs?.currentStockG ?? null,
  );

  const complete: Inputs | null =
    packageWeightG != null &&
    packageWeightG > 0 &&
    dailyGramsG != null &&
    dailyGramsG > 0 &&
    currentStockG != null
      ? { packageWeightG, dailyGramsG, currentStockG }
      : null;
  const debounced = useDebounce(complete, 600);
  React.useEffect(() => {
    if (debounced) onInputsChange(debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const daysLeft =
    complete != null
      ? Math.floor(complete.currentStockG / complete.dailyGramsG)
      : null;
  const reorderDate = daysLeft != null ? addDays(new Date(), daysLeft) : null;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {!petsQuery.isPending && !hasPets ? <AddPetBanner /> : null}

      <ToolNumberField
        label={t("tools.foodConsumption.packageWeight")}
        value={packageWeightG}
        onChangeValue={setPackage}
        unit="g"
        placeholder="0"
      />
      <ToolNumberField
        label={t("tools.foodConsumption.dailyRation")}
        value={dailyGramsG}
        onChangeValue={setDaily}
        unit="g"
        placeholder="0"
      />
      <ToolNumberField
        label={t("tools.foodConsumption.currentStock")}
        value={currentStockG}
        onChangeValue={setStock}
        unit="g"
        placeholder="0"
      />

      {daysLeft != null && reorderDate != null ? (
        <ToolSection label={t("tools.foodConsumption.results")}>
          <ToolResultCard
            label={t("tools.foodConsumption.daysLeft")}
            value={String(daysLeft)}
            unit={t("tools.foodConsumption.days")}
          />
          <ToolResultCard
            label={t("tools.foodConsumption.reorderDate")}
            value={format(reorderDate, "dd/MM/yyyy")}
          />
          {pet ? (
            <ConsumableReminderButton
              petId={pet.id}
              title={t("tools.foodConsumption.reminderTitle", {
                name: pet.name,
              })}
              dueAt={reorderDate}
            />
          ) : null}
        </ToolSection>
      ) : null}
    </ScrollView>
  );
};

export default FoodConsumptionTool;

const styles = StyleSheet.create((theme) => ({
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    paddingBottom: theme.spacing["4xl"],
  },
}));

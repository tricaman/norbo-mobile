import { NorboPressable } from "@/components/CustomPressable";
import { AddPetBanner } from "@/components/tools/AddPetBanner";
import {
  ToolNumberField,
  ToolResultCard,
  ToolSection,
} from "@/components/tools/ui";
import { useDebounce } from "@/hooks/useDebounce";
import { useMutation } from "@/hooks/useMutation";
import { petsApi } from "@/services/pets.api";
import { remindersApi } from "@/services/reminders.api";
import type { ServiceToolInput } from "@/shared/services-contract";
import { ReminderSubjectType } from "@/types/reminder.types";
import { useQuery } from "@tanstack/react-query";
import { addDays, format } from "date-fns";
import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import type { Pet } from "@/types/pet.types";
import type { ToolComponent } from "../tool-component";

type Inputs = ServiceToolInput<"food-consumption">;

const FoodConsumptionTool: ToolComponent<"food-consumption"> = ({
  pet,
  initialInputs,
  onInputsChange,
}) => {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
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
            <ReminderLink
              pet={pet}
              dueAt={reorderDate}
              labelColor={theme.colors.primary}
            />
          ) : null}
        </ToolSection>
      ) : null}
    </ScrollView>
  );
};

export default FoodConsumptionTool;

/** Creates a CONSUMABLE reminder via the existing Reminder Engine API. */
function ReminderLink({
  pet,
  dueAt,
  labelColor,
}: {
  pet: Pet;
  dueAt: Date;
  labelColor: string;
}): React.JSX.Element {
  const { t } = useTranslation();
  const { mutate, isPending, isSuccess } = useMutation({
    mutationFn: () =>
      remindersApi
        .create({
          subjectType: ReminderSubjectType.CONSUMABLE,
          petId: pet.id,
          title: t("tools.foodConsumption.reminderTitle", { name: pet.name }),
          dueAt: dueAt.toISOString(),
        })
        .then((r) => r.data),
    showSuccessToast: true,
    successMessage: t("tools.foodConsumption.reminderCreated"),
  });

  return (
    <NorboPressable
      scale="row"
      haptic="medium"
      disabled={isPending || isSuccess}
      onPress={() => mutate()}
      style={styles.reminderBtn}
    >
      <Text style={[styles.reminderLabel, { color: labelColor }]}>
        {isSuccess
          ? t("tools.foodConsumption.reminderCreated")
          : t("tools.foodConsumption.createReminder")}
      </Text>
    </NorboPressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    paddingBottom: theme.spacing["4xl"],
  },
  reminderBtn: {
    alignItems: "center",
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.pill,
    borderWidth: theme.hairline,
    borderColor: theme.colors.primary,
  },
  reminderLabel: {
    ...theme.typography.subhead,
    fontFamily: theme.fonts.monoMd,
  },
}));

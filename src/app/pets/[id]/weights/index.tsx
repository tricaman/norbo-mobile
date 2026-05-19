import { PetWeightTab } from "@/components/pets/weights/PetWeightTab";
import { Screen } from "@/components/ui/Screen";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { useLocalSearchParams } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";

export default function PetWeightsScreen() {
  const { id: petId } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();

  return (
    <Screen>
      <ScreenHeader title={t("petWeights.title")} />
      <PetWeightTab petId={petId} />
    </Screen>
  );
}

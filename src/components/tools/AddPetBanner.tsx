import { NorboPressable } from "@/components/CustomPressable";
import { EmptyState } from "@/components/ui/EmptyState";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";

/**
 * AddPetBanner — non-blocking prompt shown by pet-aware tools when the user
 * has no pets. Reuses the shared `EmptyState` (no new UI) wrapped in a pressable
 * that opens the existing add-pet flow. The tool stays usable by hand.
 */
export function AddPetBanner(): React.JSX.Element {
  const router = useRouter();
  const { t } = useTranslation();
  return (
    <NorboPressable
      scale="row"
      haptic="light"
      onPress={() => router.push("/pets/new")}
    >
      <EmptyState
        title={t("tools.common.addPetTitle")}
        subtitle={t("tools.common.addPetSubtitle")}
      />
    </NorboPressable>
  );
}

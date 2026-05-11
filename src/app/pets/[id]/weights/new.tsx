import { queryClient } from "@/app/_layout";
import { WeightForm } from "@/components/pets/weights/WeightForm";
import { QueryBoundary } from "@/components/ui/QueryBoundary";
import { Screen } from "@/components/ui/Screen";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { useMutation } from "@/hooks/useMutation";
import { petEventsApi } from "@/services/pet-events.api";
import { petsApi } from "@/services/pets.api";
import { PetEventType } from "@/types/pet-event.types";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";

export default function NewPetWeightScreen() {
  const { id: petId } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const router = useRouter();

  const petQuery = useQuery({
    queryKey: ["pets", petId],
    queryFn: () => petsApi.get(petId).then((r) => r.data),
    enabled: !!petId,
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (input: {
      weightMg: number;
      occurredAt: Date;
      notes: string | null;
    }) =>
      petEventsApi.create(petId, {
        mode: "past",
        type: PetEventType.WEIGHT_RECORD,
        title: "weight",
        description: input.notes ?? undefined,
        occurredAt: input.occurredAt.toISOString(),
        extra: { weightMg: input.weightMg },
      }),
    showSuccessToast: true,
    successMessage: t("weightForm.saveNew"),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["pet-events", petId] });
      router.back();
    },
  });

  return (
    <Screen>
      <ScreenHeader title={t("weightForm.newTitle")} />
      <QueryBoundary query={petQuery}>
        {(pet) => (
          <WeightForm
            category={pet.category}
            isSubmitting={isPending}
            submitLabel={t("weightForm.saveNew")}
            onSubmit={(values) => mutate(values)}
          />
        )}
      </QueryBoundary>
    </Screen>
  );
}

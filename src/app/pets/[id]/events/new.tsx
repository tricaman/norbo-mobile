import { Screen } from "@/components/ui/Screen";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { EventForm } from "@/components/health-timeline/EventForm";
import type { EventFormValues } from "@/components/health-timeline/EventForm";
import { useForm } from "@/hooks/useForm";
import { useMutation } from "@/hooks/useMutation";
import { petEventsApi } from "@/services/pet-events.api";
import { PetEventType } from "@/types/pet-event.types";
import { queryClient } from "@/app/_layout";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { eventFormSchema } from "@/components/health-timeline/EventForm";
import React from "react";

export default function NewEventScreen() {
  const { id: petId } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const router = useRouter();

  const form = useForm<EventFormValues>({
    schema: eventFormSchema,
    defaultValues: {
      mode: "past",
      type: PetEventType.VET_VISIT,
      occurredAt: new Date(),
      scheduledFor: undefined,
      title: "",
      description: null,
      cost: "",
      mediaAssetIds: [],
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (values: EventFormValues) =>
      petEventsApi.create(petId, {
        mode: values.mode,
        type: values.type,
        title: values.title,
        description: values.description ?? undefined,
        cost: values.cost ? parseFloat(values.cost) : undefined,
        mediaAssetIds:
          values.mediaAssetIds && values.mediaAssetIds.length > 0
            ? values.mediaAssetIds
            : undefined,
        occurredAt:
          values.mode === "past" && values.occurredAt
            ? values.occurredAt.toISOString()
            : undefined,
        scheduledFor:
          values.mode === "future" && values.scheduledFor
            ? values.scheduledFor.toISOString()
            : undefined,
      }),
    showSuccessToast: true,
    successMessage: t("eventForm.saveNew"),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["pet-events", petId] });
      router.back();
    },
  });

  return (
    <Screen>
      <ScreenHeader title={t("eventForm.newTitle")} />
      <EventForm
        form={form}
        isSubmitting={isPending}
        submitLabel={t("eventForm.saveNew")}
        onSubmit={(v) => mutate(v)}
      />
    </Screen>
  );
}

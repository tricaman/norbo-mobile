import { Screen } from "@/components/ui/Screen";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { QueryBoundary } from "@/components/ui/QueryBoundary";
import { EventForm } from "@/components/health-timeline/EventForm";
import type { EventFormValues } from "@/components/health-timeline/EventForm";
import { eventFormSchema } from "@/components/health-timeline/EventForm";
import { useForm } from "@/hooks/useForm";
import { useMutation } from "@/hooks/useMutation";
import { petEventsApi } from "@/services/pet-events.api";
import type { PetEvent } from "@/types/pet-event.types";
import { PetEventStatus } from "@/types/pet-event.types";
import { queryClient } from "@/app/_layout";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import React from "react";

export default function EditEventScreen() {
  const { id: petId, eventId } = useLocalSearchParams<{
    id: string;
    eventId: string;
  }>();

  const query = useQuery({
    queryKey: ["pet-events", petId, eventId],
    queryFn: () => petEventsApi.get(petId, eventId).then((r) => r.data),
    enabled: !!petId && !!eventId,
  });

  return (
    <Screen>
      <QueryBoundary query={query}>
        {(event) => <EditForm petId={petId} event={event} />}
      </QueryBoundary>
    </Screen>
  );
}

function EditForm({ petId, event }: { petId: string; event: PetEvent }) {
  const { t } = useTranslation();
  const router = useRouter();

  const isScheduled = event.status === PetEventStatus.SCHEDULED;

  const form = useForm<EventFormValues>({
    schema: eventFormSchema,
    defaultValues: {
      mode: isScheduled ? "future" : "past",
      type: event.type,
      title: event.title,
      description: event.description ?? null,
      cost: event.cost !== null ? String(event.cost) : "",
      occurredAt: event.occurredAt ? new Date(event.occurredAt) : undefined,
      scheduledFor: event.scheduledFor
        ? new Date(event.scheduledFor)
        : undefined,
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (values: EventFormValues) =>
      petEventsApi.update(petId, event.id, {
        title: values.title,
        description: values.description ?? undefined,
        cost: values.cost ? parseFloat(values.cost) : undefined,
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
    successMessage: t("eventForm.saveEdit"),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["pet-events", petId] });
      router.back();
    },
  });

  return (
    <>
      <ScreenHeader title={t("eventForm.editTitle")} />
      <EventForm
        form={form}
        isSubmitting={isPending}
        submitLabel={t("eventForm.saveEdit")}
        onSubmit={(v) => mutate(v)}
        disableTypeChange
      />
    </>
  );
}

import { queryClient } from "@/app/_layout";
import type { EventFormValues } from "@/components/health-timeline/EventForm";
import {
  buildExtra,
  EventForm,
  eventFormSchema,
} from "@/components/health-timeline/EventForm";
import { Screen } from "@/components/ui/Screen";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { useForm } from "@/hooks/useForm";
import { useMutation } from "@/hooks/useMutation";
import { expensesApi } from "@/services/expenses.api";
import { petEventsApi } from "@/services/pet-events.api";
import { defaultExpenseCategoryFor } from "@/shared/pet-event-schemas";
import { ExpenseCategory } from "@/types/expense.types";
import { PetEventType } from "@/types/pet-event.types";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";

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
      createReminder: true,
      createExpense: false,
      vaccineName: "",
      reason: "",
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
        createReminder:
          values.mode === "future" ? (values.createReminder ?? true) : false,
        extra: buildExtra(values),
      }),
    showSuccessToast: true,
    successMessage: t("eventForm.saveSuccess"),
    onSuccess: (response, values) => {
      void queryClient.invalidateQueries({ queryKey: ["pet-events", petId] });
      router.back();

      // Inline expense creation — fire-and-forget; event save already succeeded.
      const cost = parseFloat(values.cost ?? "0");
      if (
        values.createExpense &&
        values.mode === "past" &&
        cost > 0 &&
        values.occurredAt
      ) {
        // `defaultExpenseCategoryFor` returns null when the event type is
        // not cost-bearing. The EventForm UI should have already prevented
        // `createExpense=true` in that case, but we guard defensively here.
        const category =
          defaultExpenseCategoryFor(values.type) ?? ExpenseCategory.OTHER;
        // `petEventsApi.create` returns the raw axios response, so the
        // created event lives at `response.data`.
        const createdEventId = response.data.id;

        // Currency is intentionally omitted so the backend can apply the
        // user's preferred currency. Hardcoding "EUR" here was producing
        // mixed-currency summaries that couldn't be aggregated correctly.
        void expensesApi
          .create({
            petId,
            amount: cost,
            category,
            occurredAt: values.occurredAt.toISOString(),
            petEventId: createdEventId,
          })
          .then(() => {
            void queryClient.invalidateQueries({ queryKey: ["expenses"] });
            void queryClient.invalidateQueries({
              queryKey: ["expenses-summary"],
            });
          })
          .catch((err: unknown) => {
            console.warn("[NewEventScreen] expense creation failed:", err);
          });
      }
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

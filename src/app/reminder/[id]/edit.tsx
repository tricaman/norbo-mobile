import { queryClient } from "@/app/_layout";
import {
  ReminderForm,
  reminderFormSchema,
  type ReminderFormValues,
} from "@/components/reminders/ReminderForm";
import { QueryBoundary } from "@/components/ui/QueryBoundary";
import { Screen } from "@/components/ui/Screen";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { useForm } from "@/hooks/useForm";
import { useMutation } from "@/hooks/useMutation";
import { remindersApi } from "@/services/reminders.api";
import type { Reminder } from "@/types/reminder.types";
import { useQuery } from "@tanstack/react-query";
import { parseISO } from "date-fns";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";

export default function EditReminderScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();

  const query = useQuery({
    queryKey: ["reminders", "detail", id],
    queryFn: () => remindersApi.get(id).then((r) => r.data),
    enabled: !!id,
  });

  return (
    <Screen>
      <QueryBoundary query={query}>
        {(reminder) => <EditForm reminder={reminder} />}
      </QueryBoundary>
    </Screen>
  );
}

function EditForm({ reminder }: { reminder: Reminder }): React.JSX.Element {
  const { t } = useTranslation();
  const router = useRouter();

  const form = useForm<ReminderFormValues>({
    schema: reminderFormSchema,
    defaultValues: {
      subjectType: reminder.subjectType,
      dueAt: parseISO(reminder.dueAt),
      title: reminder.title,
      description: reminder.description ?? null,
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (values: ReminderFormValues) =>
      remindersApi.update(reminder.id, {
        title: values.title,
        description: values.description ?? null,
        dueAt: values.dueAt.toISOString(),
      }),
    showSuccessToast: true,
    successMessage: t("reminderForm.saveEdit"),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["reminders"] });
      void queryClient.invalidateQueries({
        queryKey: ["reminders", "detail", reminder.id],
      });
      router.back();
    },
  });

  return (
    <>
      <ScreenHeader title={t("reminderForm.editTitle")} />
      <ReminderForm
        form={form}
        isSubmitting={isPending}
        submitLabel={t("reminderForm.saveEdit")}
        onSubmit={(values) => { mutate(values); }}
        disableSubjectTypeChange
      />
    </>
  );
}

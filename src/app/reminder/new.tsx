import { queryClient } from "@/app/_layout";
import {
  ReminderForm,
  reminderFormSchema,
  type ReminderFormValues,
} from "@/components/reminders/ReminderForm";
import { Screen } from "@/components/ui/Screen";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { useForm } from "@/hooks/useForm";
import { useMutation } from "@/hooks/useMutation";
import { remindersApi } from "@/services/reminders.api";
import { ReminderSubjectType } from "@/types/reminder.types";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";

export default function NewReminderScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const router = useRouter();

  const form = useForm<ReminderFormValues>({
    schema: reminderFormSchema,
    defaultValues: {
      subjectType: ReminderSubjectType.CUSTOM,
      title: "",
      description: null,
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (values: ReminderFormValues) =>
      remindersApi.create({
        subjectType: values.subjectType,
        title: values.title,
        description: values.description ?? null,
        dueAt: values.dueAt.toISOString(),
      }),
    showSuccessToast: true,
    successMessage: t("reminderForm.saveNew"),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["reminders"] });
      router.back();
    },
  });

  return (
    <Screen>
      <ScreenHeader title={t("reminderForm.newTitle")} />
      <ReminderForm
        form={form}
        isSubmitting={isPending}
        submitLabel={t("reminderForm.saveNew")}
        onSubmit={(values) => { mutate(values); }}
      />
    </Screen>
  );
}

import { queryClient } from "@/app/_layout";
import { NorboPressable } from "@/components/CustomPressable";
import { IconSymbol } from "@/components/ui/IconSymbol";
import {
  SingleSelectSheet,
  type SingleSelectOption,
} from "@/components/ui/SingleSelectSheet";
import { DateField } from "@/components/ui/DateField";
import { FormCard } from "@/components/ui/FormCard";
import { FormInput } from "@/components/ui/FormInput";
import { QueryBoundary } from "@/components/ui/QueryBoundary";
import { Screen } from "@/components/ui/Screen";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { SCREEN_BOTTOM_PADDING } from "@/constants/layout";
import { useForm } from "@/hooks/useForm";
import { useMutation } from "@/hooks/useMutation";
import { expensesApi } from "@/services/expenses.api";
import type { Expense } from "@/types/expense.types";
import { ExpenseCategory } from "@/types/expense.types";
import { useQuery } from "@tanstack/react-query";
import { parseISO } from "date-fns";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Controller, FormProvider } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { ScrollView, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { z } from "zod";

const editSchema = z.object({
  amount: z.string().refine((v) => parseFloat(v) > 0, "required"),
  category: z.nativeEnum(ExpenseCategory),
  occurredAt: z.date(),
  description: z.string().max(500).nullable().optional(),
});

type EditFormValues = z.infer<typeof editSchema>;

export default function EditExpenseScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useQuery({
    queryKey: ["expense", id],
    queryFn: () => expensesApi.get(id).then((r) => r.data),
    enabled: !!id,
  });
  return (
    <Screen>
      <QueryBoundary query={query}>
        {(expense) => <EditForm expense={expense} />}
      </QueryBoundary>
    </Screen>
  );
}

function EditForm({ expense }: { expense: Expense }): React.JSX.Element {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const form = useForm<EditFormValues>({
    schema: editSchema,
    defaultValues: {
      amount: String(expense.amount),
      category: expense.category,
      occurredAt: parseISO(expense.occurredAt),
      description: expense.description ?? null,
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (values: EditFormValues) =>
      expensesApi.update(expense.id, {
        amount: parseFloat(values.amount),
        category: values.category,
        occurredAt: values.occurredAt.toISOString(),
        description: values.description ?? null,
      }),
    showSuccessToast: true,
    successMessage: t("expenses.saveEdit"),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["expenses"] });
      void queryClient.invalidateQueries({ queryKey: ["expenses-summary"] });
      void queryClient.invalidateQueries({ queryKey: ["expense", expense.id] });
      router.back();
    },
  });

  const categoryIcons: Record<string, string> = {
    VET: "stethoscope",
    FOOD: "fork.knife",
    ACCESSORIES: "bag",
    GROOMING: "scissors",
    OTHER: "creditcard",
  };

  const categoryOptions = useMemo<SingleSelectOption<ExpenseCategory>[]>(
    () => Object.values(ExpenseCategory).map((c) => ({
      value: c,
      label: t(`expenses.categories.${c}` as "expenses.categories.VET"),
      leading: () => (
        <IconSymbol
          name={categoryIcons[c] ?? "creditcard"}
          size={18}
          tintColor={theme.colors.textSecondary}
        />
      ),
    })),
    [t, theme],
  );

  const handleSubmit = form.handleSubmit((v) => mutate(v));

  return (
    <>
      <ScreenHeader title={t("expenses.editTitle")} />
      <FormProvider {...form}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.scroll, { paddingBottom: SCREEN_BOTTOM_PADDING + insets.bottom + 80 }]}
        >
          <SectionLabel style={styles.label}>{t("expenses.fieldCategory")}</SectionLabel>
          <Controller
            control={form.control}
            name="category"
            render={({ field }) => (
              <SingleSelectSheet options={categoryOptions} value={field.value} onChange={field.onChange} title={t("expenses.fieldCategory")} />
            )}
          />

          <SectionLabel style={styles.label}>{t("expenses.fieldAmount")}</SectionLabel>
          <FormCard style={styles.card}>
            <FormInput name="amount" placeholder="0.00" keyboardType="decimal-pad" returnKeyType="done" />
          </FormCard>

          <SectionLabel style={styles.label}>{t("expenses.fieldDate")}</SectionLabel>
          <FormCard style={styles.card}>
            <Controller
              control={form.control}
              name="occurredAt"
              render={({ field }) => (
                <DateField
                  value={field.value instanceof Date ? field.value : null}
                  onChange={field.onChange}
                  maximumDate={new Date()}
                  placeholder={t("common.tapToSet") as string}
                />
              )}
            />
          </FormCard>

          <SectionLabel style={styles.label}>{t("expenses.fieldDescription")}</SectionLabel>
          <FormCard style={styles.card}>
            <FormInput name="description" placeholder={t("expenses.fieldDescription")} multiline numberOfLines={2} returnKeyType="done" />
          </FormCard>

          <NorboPressable
            style={[styles.submitBtn, { backgroundColor: isPending ? theme.colors.border : theme.colors.primary }]}
            haptic="medium"
            disabled={isPending}
            onPress={() => { void handleSubmit(); }}
          >
            <Text style={[styles.submitLabel, { color: theme.colors.textOnPrimary }]}>
              {t("expenses.saveEdit")}
            </Text>
          </NorboPressable>
        </ScrollView>
      </FormProvider>
    </>
  );
}

const styles = StyleSheet.create((theme) => ({
  scroll: { paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.lg },
  label: { marginTop: theme.spacing.lg, marginBottom: theme.spacing.xs },
  card: { marginBottom: 0 },
  submitBtn: { marginTop: theme.spacing["2xl"], paddingVertical: theme.spacing.md, borderRadius: theme.radius.pill, alignItems: "center" },
  submitLabel: { ...theme.typography.subhead, fontWeight: "700" },
}));

import { queryClient } from "@/app/_layout";
import { NorboPressable } from "@/components/CustomPressable";
import type { ChipOption } from "@/components/ui/ChipSelector";
import { ChipSelector } from "@/components/ui/ChipSelector";
import { DateField } from "@/components/ui/DateField";
import { FormCard } from "@/components/ui/FormCard";
import { FormInput } from "@/components/ui/FormInput";
import { Screen } from "@/components/ui/Screen";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { SCREEN_BOTTOM_PADDING } from "@/constants/layout";
import { useForm } from "@/hooks/useForm";
import { useMediaUpload } from "@/hooks/useMediaUpload";
import { useMutation } from "@/hooks/useMutation";
import { expensesApi } from "@/services/expenses.api";
import { petsApi } from "@/services/pets.api";
import { ExpenseCategory } from "@/types/expense.types";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Controller, FormProvider } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, ScrollView, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { z } from "zod";

const expenseFormSchema = z.object({
  petId: z.string().uuid({ message: "required" }),
  amount: z.string().refine((v) => parseFloat(v) > 0, "required"),
  category: z.nativeEnum(ExpenseCategory),
  occurredAt: z.date(),
  description: z.string().max(500).nullable().optional(),
  receiptMediaAssetId: z.string().uuid().nullable().optional(),
  receiptUrl: z.string().nullable().optional(),
  petEventId: z.string().uuid().nullable().optional(),
});

type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

export default function NewExpenseScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Pre-fill support from nudge or direct navigation
  const params = useLocalSearchParams<{
    petId?: string;
    amount?: string;
    category?: string;
    petEventId?: string;
  }>();

  const petsQuery = useQuery({
    queryKey: ["pets"],
    queryFn: () => petsApi.list().then((r) => r.data),
  });
  const pets = petsQuery.data ?? [];

  const { pickAndUpload, asset, state: uploadState } = useMediaUpload();

  const form = useForm<ExpenseFormValues>({
    schema: expenseFormSchema,
    defaultValues: {
      petId: params.petId ?? pets[0]?.id ?? "",
      amount: params.amount ?? "",
      category:
        (params.category as ExpenseCategory | undefined) ?? ExpenseCategory.VET,
      occurredAt: new Date(),
      description: null,
      receiptMediaAssetId: null,
      receiptUrl: null,
      petEventId: params.petEventId ?? null,
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (values: ExpenseFormValues) =>
      expensesApi.create({
        petId: values.petId,
        amount: parseFloat(values.amount),
        // Currency intentionally omitted: backend resolves the user's
        // preferred currency so cross-pet summaries stay aggregable.
        category: values.category,
        description: values.description ?? null,
        occurredAt: values.occurredAt.toISOString(),
        receiptMediaAssetId: values.receiptMediaAssetId ?? null,
        receiptUrl: values.receiptUrl ?? null,
        petEventId: values.petEventId ?? null,
      }),
    showSuccessToast: true,
    successMessage: t("expenses.saveNew"),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["expenses"] });
      void queryClient.invalidateQueries({ queryKey: ["expenses-summary"] });
      router.back();
    },
  });

  const categoryOptions = useMemo<ChipOption<ExpenseCategory>[]>(
    () =>
      Object.values(ExpenseCategory).map((c) => ({
        value: c,
        label: t(`expenses.categories.${c}` as "expenses.categories.VET"),
        icon: {
          VET: "stethoscope",
          FOOD: "fork.knife",
          ACCESSORIES: "bag",
          GROOMING: "scissors",
          OTHER: "creditcard",
        }[c],
      })),
    [t],
  );

  const petOptions = useMemo<ChipOption<string>[]>(
    () => (petsQuery.data ?? []).map((p) => ({ value: p.id, label: p.name })),
    [petsQuery.data],
  );

  const handleReceiptPick = async (): Promise<void> => {
    const result = await pickAndUpload("EXPENSE_RECEIPT" as never);
    if (result) {
      form.setValue("receiptMediaAssetId", result.id);
      form.setValue("receiptUrl", result.originalUrl ?? null);
    }
  };

  const handleSubmit = form.handleSubmit((v) => mutate(v));

  return (
    <Screen>
      <ScreenHeader title={t("expenses.addTitle")} />
      <FormProvider {...form}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: SCREEN_BOTTOM_PADDING + insets.bottom + 80 },
          ]}
        >
          {pets.length > 1 && (
            <>
              <SectionLabel style={styles.label}>
                {t("expenses.fieldPet")}
              </SectionLabel>
              <Controller
                control={form.control}
                name="petId"
                render={({ field }) => (
                  <ChipSelector
                    options={petOptions}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </>
          )}

          <SectionLabel style={styles.label}>
            {t("expenses.fieldCategory")}
          </SectionLabel>
          <Controller
            control={form.control}
            name="category"
            render={({ field }) => (
              <ChipSelector
                options={categoryOptions}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />

          <SectionLabel style={styles.label}>
            {t("expenses.fieldAmount")}
          </SectionLabel>
          <FormCard style={styles.card}>
            <FormInput
              name="amount"
              placeholder="0.00"
              keyboardType="decimal-pad"
              returnKeyType="done"
            />
          </FormCard>

          <SectionLabel style={styles.label}>
            {t("expenses.fieldDate")}
          </SectionLabel>
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

          <SectionLabel style={styles.label}>
            {t("expenses.fieldDescription")}
          </SectionLabel>
          <FormCard style={styles.card}>
            <FormInput
              name="description"
              placeholder={t("expenses.fieldDescription")}
              multiline
              numberOfLines={2}
              returnKeyType="done"
            />
          </FormCard>

          <SectionLabel style={styles.label}>
            {t("expenses.fieldReceipt")}
          </SectionLabel>
          <NorboPressable
            style={[
              styles.receiptBtn,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
            haptic="light"
            onPress={() => {
              void handleReceiptPick();
            }}
            disabled={uploadState === "uploading"}
          >
            {uploadState === "uploading" ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : asset?.thumbSmUrl ? (
              <Image
                source={{ uri: asset.thumbSmUrl }}
                style={styles.receiptThumb}
                contentFit="cover"
              />
            ) : (
              <Text
                style={[
                  styles.receiptBtnLabel,
                  { color: theme.colors.textTertiary },
                ]}
              >
                {t("expenses.fieldReceipt")}
              </Text>
            )}
          </NorboPressable>

          <NorboPressable
            style={[
              styles.submitBtn,
              {
                backgroundColor: isPending
                  ? theme.colors.border
                  : theme.colors.primary,
              },
            ]}
            haptic="medium"
            disabled={isPending}
            onPress={() => {
              void handleSubmit();
            }}
          >
            <Text
              style={[
                styles.submitLabel,
                { color: theme.colors.textOnPrimary },
              ]}
            >
              {t("expenses.saveNew")}
            </Text>
          </NorboPressable>
        </ScrollView>
      </FormProvider>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  scroll: { paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.lg },
  label: { marginTop: theme.spacing.lg, marginBottom: theme.spacing.xs },
  card: { marginBottom: 0 },
  receiptBtn: {
    height: 80,
    borderRadius: theme.radius.md,
    borderWidth: theme.hairline,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  receiptThumb: { width: "100%", height: "100%" },
  receiptBtnLabel: { ...theme.typography.subhead },
  submitBtn: {
    marginTop: theme.spacing["2xl"],
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.pill,
    alignItems: "center",
  },
  submitLabel: { ...theme.typography.subhead, fontWeight: "700" },
}));

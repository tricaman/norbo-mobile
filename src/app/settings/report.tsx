import { NorboPressable } from "@/components/CustomPressable";
import { IconSymbol } from "@/components/ui/IconSymbol";
import {
  SingleSelectSheet,
  type SingleSelectOption,
} from "@/components/ui/SingleSelectSheet";
import { FormCard } from "@/components/ui/FormCard";
import { FormInput } from "@/components/ui/FormInput";
import { Screen } from "@/components/ui/Screen";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { SCREEN_BOTTOM_PADDING } from "@/constants/layout";
import { useForm } from "@/hooks/useForm";
import { useMutation } from "@/hooks/useMutation";
import { reportsApi } from "@/services/reports.api";
import { petsApi } from "@/services/pets.api";
import { ReportType } from "@/types/report.types";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Controller, FormProvider } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { ScrollView, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { z } from "zod";

const reportFormSchema = z.object({
  type: z.nativeEnum(ReportType),
  subject: z.string().min(1, "required").max(200),
  body: z.string().min(1, "required").max(5000),
  petId: z.string().uuid().nullable().optional(),
});

type ReportFormValues = z.infer<typeof reportFormSchema>;

export default function ReportScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const petsQuery = useQuery({
    queryKey: ["pets"],
    queryFn: () => petsApi.list().then((r) => r.data),
  });
  const pets = petsQuery.data ?? [];

  const form = useForm<ReportFormValues>({
    schema: reportFormSchema,
    defaultValues: {
      type: ReportType.BUG,
      subject: "",
      body: "",
      petId: null,
    },
  });

  const selectedType = form.watch("type");

  const { mutate, isPending } = useMutation({
    mutationFn: (values: ReportFormValues) =>
      reportsApi.create({
        type: values.type,
        subject: values.subject,
        body: values.body,
        petId: values.petId ?? null,
      }),
    showSuccessToast: true,
    successMessage: t("report.success"),
    onSuccess: () => {
      router.back();
    },
  });

  const typeIcons: Record<string, string> = {
    BUG: "ladybug",
    INAPPROPRIATE_CONTENT: "exclamationmark.triangle",
    PET_HEALTH: "heart.text.clipboard",
  };

  const typeOptions = useMemo<SingleSelectOption<ReportType>[]>(
    () =>
      Object.values(ReportType).map((type) => ({
        value: type,
        label: t(`report.types.${type}` as "report.types.BUG"),
        leading: () => (
          <IconSymbol
            name={typeIcons[type] ?? "doc.text"}
            size={18}
            tintColor={theme.colors.textSecondary}
          />
        ),
      })),
    [t, theme],
  );

  const petOptions = useMemo<SingleSelectOption<string>[]>(
    () => pets.map((p) => ({ value: p.id, label: p.name })),
    [pets],
  );

  const handleSubmit = form.handleSubmit((v) => mutate(v));

  return (
    <Screen>
      <ScreenHeader title={t("report.title")} />
      <FormProvider {...form}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: SCREEN_BOTTOM_PADDING + insets.bottom + 80 },
          ]}
        >
          <SectionLabel style={styles.label}>
            {t("report.typeLabel")}
          </SectionLabel>
          <Controller
            control={form.control}
            name="type"
            render={({ field }) => (
              <SingleSelectSheet
                options={typeOptions}
                value={field.value}
                onChange={field.onChange}
                title={t("report.typeLabel")}
              />
            )}
          />
          <Text style={styles.typeDescription}>
            {t(
              `report.typeDescriptions.${selectedType}` as "report.typeDescriptions.BUG",
            )}
          </Text>

          {selectedType === ReportType.PET_HEALTH && pets.length > 0 && (
            <>
              <SectionLabel style={styles.label}>
                {t("report.petLabel")}
              </SectionLabel>
              <Controller
                control={form.control}
                name="petId"
                render={({ field }) => (
                  <SingleSelectSheet
                    options={petOptions}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    title={t("report.petLabel")}
                  />
                )}
              />
            </>
          )}

          <SectionLabel style={styles.label}>
            {t("report.subjectLabel")}
          </SectionLabel>
          <FormCard style={styles.card}>
            <FormInput
              name="subject"
              placeholder={t("report.subjectPlaceholder")}
              returnKeyType="next"
            />
          </FormCard>

          <SectionLabel style={styles.label}>
            {t("report.bodyLabel")}
          </SectionLabel>
          <FormCard style={styles.card}>
            <FormInput
              name="body"
              placeholder={t("report.bodyPlaceholder")}
              multiline
              numberOfLines={5}
              returnKeyType="done"
            />
          </FormCard>

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
              {t("report.submit")}
            </Text>
          </NorboPressable>
        </ScrollView>
      </FormProvider>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  scroll: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
  label: { marginTop: theme.spacing.lg, marginBottom: theme.spacing.xs },
  card: { marginBottom: 0 },
  typeDescription: {
    ...theme.typography.footnote,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
    paddingHorizontal: theme.spacing.xs,
  },
  submitBtn: {
    marginTop: theme.spacing["2xl"],
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.pill,
    alignItems: "center",
  },
  submitLabel: { ...theme.typography.subhead, fontWeight: "700" },
}));

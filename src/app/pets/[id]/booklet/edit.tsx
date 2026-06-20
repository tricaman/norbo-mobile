import { queryClient } from "@/app/_layout";
import { DateField } from "@/components/ui/DateField";
import { FormCard } from "@/components/ui/FormCard";
import { FormInput } from "@/components/ui/FormInput";
import { SaveHeaderAction } from "@/components/ui/SaveHeaderAction";
import { Screen } from "@/components/ui/Screen";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { SCREEN_BOTTOM_PADDING } from "@/constants/layout";
import { useBooklet } from "@/hooks/useBooklet";
import { useForm } from "@/hooks/useForm";
import { useMutation } from "@/hooks/useMutation";
import { bookletApi } from "@/services/booklet.api";
import type { PetBooklet, UpdatePetBookletInput } from "@/types/booklet.types";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { Controller, FormProvider } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { z } from "zod";

const bookletFormSchema = z.object({
  microchipNumber: z.string().optional(),
  microchipImplantedAt: z.date().nullable().optional(),
  microchipLocation: z.string().optional(),
  tattooNumber: z.string().optional(),
  passportNumber: z.string().optional(),
  registrationNumber: z.string().optional(),
  pedigreeNumber: z.string().optional(),
  vetName: z.string().optional(),
  vetClinic: z.string().optional(),
  vetPhone: z.string().optional(),
  insuranceProvider: z.string().optional(),
  insurancePolicyNumber: z.string().optional(),
  bloodType: z.string().optional(),
  allergies: z.string().optional(),
  chronicConditions: z.string().optional(),
  notes: z.string().optional(),
});

type BookletFormValues = z.infer<typeof bookletFormSchema>;

/** Trim a text field to a value or `null` (clears it server-side). */
function clean(value?: string): string | null {
  const v = (value ?? "").trim();
  return v.length > 0 ? v : null;
}

function buildInput(values: BookletFormValues): UpdatePetBookletInput {
  return {
    microchipNumber: clean(values.microchipNumber),
    microchipImplantedAt: values.microchipImplantedAt
      ? values.microchipImplantedAt.toISOString()
      : null,
    microchipLocation: clean(values.microchipLocation),
    tattooNumber: clean(values.tattooNumber),
    passportNumber: clean(values.passportNumber),
    registrationNumber: clean(values.registrationNumber),
    pedigreeNumber: clean(values.pedigreeNumber),
    vetName: clean(values.vetName),
    vetClinic: clean(values.vetClinic),
    vetPhone: clean(values.vetPhone),
    insuranceProvider: clean(values.insuranceProvider),
    insurancePolicyNumber: clean(values.insurancePolicyNumber),
    bloodType: clean(values.bloodType),
    allergies: (values.allergies ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0),
    chronicConditions: clean(values.chronicConditions),
    notes: clean(values.notes),
  };
}

export default function EditBookletScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useUnistyles();
  const bookletQuery = useBooklet(id);

  return (
    <Screen>
      {bookletQuery.isPending ? (
        <View style={styles.centered}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      ) : (
        <EditForm petId={id} booklet={bookletQuery.data ?? null} />
      )}
    </Screen>
  );
}

function EditForm({
  petId,
  booklet,
}: {
  petId: string;
  booklet: PetBooklet | null;
}) {
  const { t } = useTranslation();
  const router = useRouter();

  const form = useForm<BookletFormValues>({
    schema: bookletFormSchema,
    defaultValues: {
      microchipNumber: booklet?.microchipNumber ?? "",
      microchipImplantedAt: booklet?.microchipImplantedAt
        ? new Date(booklet.microchipImplantedAt)
        : null,
      microchipLocation: booklet?.microchipLocation ?? "",
      tattooNumber: booklet?.tattooNumber ?? "",
      passportNumber: booklet?.passportNumber ?? "",
      registrationNumber: booklet?.registrationNumber ?? "",
      pedigreeNumber: booklet?.pedigreeNumber ?? "",
      vetName: booklet?.vetName ?? "",
      vetClinic: booklet?.vetClinic ?? "",
      vetPhone: booklet?.vetPhone ?? "",
      insuranceProvider: booklet?.insuranceProvider ?? "",
      insurancePolicyNumber: booklet?.insurancePolicyNumber ?? "",
      bloodType: booklet?.bloodType ?? "",
      allergies: booklet?.allergies?.join(", ") ?? "",
      chronicConditions: booklet?.chronicConditions ?? "",
      notes: booklet?.notes ?? "",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (input: UpdatePetBookletInput) =>
      bookletApi.update(petId, input),
    showSuccessToast: true,
    successMessage: t("petDetail.booklet.saveSuccess"),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["booklet", petId] });
      router.back();
    },
  });

  const submit = form.handleSubmit((values) => mutate(buildInput(values)));

  return (
    <>
      <ScreenHeader
        title={t("petDetail.booklet.editTitle")}
        right={<SaveHeaderAction onPress={submit} disabled={isPending} />}
      />
      <FormProvider {...form}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <FormCard label={t("petDetail.booklet.identitySection")}>
            <FormInput<BookletFormValues>
              name="microchipNumber"
              label={t("petDetail.booklet.fields.microchipNumber")}
              placeholder={t("petDetail.booklet.placeholder")}
              autoCorrect={false}
            />
            <Text style={styles.fieldLabel}>
              {t("petDetail.booklet.fields.microchipImplantedAt")}
            </Text>
            <Controller
              name="microchipImplantedAt"
              control={form.control}
              render={({ field }) => (
                <DateField
                  value={field.value ?? null}
                  onChange={field.onChange}
                  maximumDate={new Date()}
                  placeholder={t("common.tapToSet") as string}
                />
              )}
            />
            <FormInput<BookletFormValues>
              name="microchipLocation"
              label={t("petDetail.booklet.fields.microchipLocation")}
              placeholder={t("petDetail.booklet.placeholder")}
            />
            <FormInput<BookletFormValues>
              name="tattooNumber"
              label={t("petDetail.booklet.fields.tattooNumber")}
              placeholder={t("petDetail.booklet.placeholder")}
              autoCorrect={false}
            />
            <FormInput<BookletFormValues>
              name="passportNumber"
              label={t("petDetail.booklet.fields.passportNumber")}
              placeholder={t("petDetail.booklet.placeholder")}
              autoCorrect={false}
            />
            <FormInput<BookletFormValues>
              name="registrationNumber"
              label={t("petDetail.booklet.fields.registrationNumber")}
              placeholder={t("petDetail.booklet.placeholder")}
              autoCorrect={false}
            />
            <FormInput<BookletFormValues>
              name="pedigreeNumber"
              label={t("petDetail.booklet.fields.pedigreeNumber")}
              placeholder={t("petDetail.booklet.placeholder")}
              autoCorrect={false}
            />
          </FormCard>

          <FormCard label={t("petDetail.booklet.vetSection")}>
            <FormInput<BookletFormValues>
              name="vetName"
              label={t("petDetail.booklet.fields.vetName")}
              placeholder={t("petDetail.booklet.placeholder")}
            />
            <FormInput<BookletFormValues>
              name="vetClinic"
              label={t("petDetail.booklet.fields.vetClinic")}
              placeholder={t("petDetail.booklet.placeholder")}
            />
            <FormInput<BookletFormValues>
              name="vetPhone"
              label={t("petDetail.booklet.fields.vetPhone")}
              placeholder={t("petDetail.booklet.placeholder")}
              keyboardType="phone-pad"
            />
          </FormCard>

          <FormCard label={t("petDetail.booklet.insuranceSection")}>
            <FormInput<BookletFormValues>
              name="insuranceProvider"
              label={t("petDetail.booklet.fields.insuranceProvider")}
              placeholder={t("petDetail.booklet.placeholder")}
            />
            <FormInput<BookletFormValues>
              name="insurancePolicyNumber"
              label={t("petDetail.booklet.fields.insurancePolicyNumber")}
              placeholder={t("petDetail.booklet.placeholder")}
              autoCorrect={false}
            />
          </FormCard>

          <FormCard label={t("petDetail.booklet.healthSection")}>
            <FormInput<BookletFormValues>
              name="bloodType"
              label={t("petDetail.booklet.fields.bloodType")}
              placeholder={t("petDetail.booklet.placeholder")}
              autoCorrect={false}
            />
            <FormInput<BookletFormValues>
              name="allergies"
              label={t("petDetail.booklet.fields.allergies")}
              placeholder={t("petDetail.booklet.allergiesPlaceholder")}
            />
            <FormInput<BookletFormValues>
              name="chronicConditions"
              label={t("petDetail.booklet.fields.chronicConditions")}
              placeholder={t("petDetail.booklet.placeholder")}
              multiline
              numberOfLines={3}
            />
            <FormInput<BookletFormValues>
              name="notes"
              label={t("petDetail.booklet.fields.notes")}
              placeholder={t("petDetail.booklet.placeholder")}
              multiline
              numberOfLines={3}
            />
          </FormCard>
        </ScrollView>
      </FormProvider>
    </>
  );
}

const styles = StyleSheet.create((theme) => ({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    padding: theme.spacing["3xl"],
    paddingBottom: SCREEN_BOTTOM_PADDING,
    gap: theme.spacing.md,
  },
  fieldLabel: {
    ...theme.typography.footnote,
    color: theme.colors.primary,
    textTransform: "lowercase",
    letterSpacing: 0.8,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.xs,
  },
}));

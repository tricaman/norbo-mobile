import { NorboPressable } from "@/components/CustomPressable";
import { AvatarUploader } from "@/components/media/AvatarUploader";
import { CATEGORY_META } from "@/components/pets/wizard/category-meta";
import { FormCard } from "@/components/ui/FormCard";
import { FormInput } from "@/components/ui/FormInput";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { QueryBoundary } from "@/components/ui/QueryBoundary";
import { SaveHeaderAction } from "@/components/ui/SaveHeaderAction";
import { Screen } from "@/components/ui/Screen";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { SCREEN_BOTTOM_PADDING } from "@/constants/layout";
import { useForm } from "@/hooks/useForm";
import { useMutation } from "@/hooks/useMutation";
import { petsApi } from "@/services/pets.api";
import {
  PetCategory,
  Sex,
  type Pet,
  type SpeciesResult,
} from "@/types/pet.types";
import { queryClient } from "@/app/_layout";
import type { MediaAsset } from "@/types/media.types";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Controller, FormProvider } from "react-hook-form";
import { ScrollView, Text, TextInput, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { useTranslation } from "react-i18next";
import { z } from "zod";

const petEditSchema = z.object({
  name: z.string().min(1),
  speciesId: z.string().nullable().optional(),
  sex: z.nativeEnum(Sex).optional(),
  birthDate: z.string().nullable().optional(),
  sterilized: z.boolean().nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

type PetEditValues = z.infer<typeof petEditSchema>;

const SEXES = [Sex.MALE, Sex.FEMALE, Sex.UNKNOWN] as const;

const SEX_LABEL_KEYS = {
  [Sex.MALE]: "petForm.sexMale",
  [Sex.FEMALE]: "petForm.sexFemale",
  [Sex.UNKNOWN]: "petForm.sexUnknown",
} as const satisfies Record<Sex, string>;

export default function EditPetScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const petQuery = useQuery({
    queryKey: ["pets", id],
    queryFn: () => petsApi.get(id).then((r) => r.data),
    enabled: !!id,
  });

  return (
    <Screen>
      <QueryBoundary query={petQuery}>
        {(pet) => <EditForm pet={pet} petId={id} />}
      </QueryBoundary>
    </Screen>
  );
}

function EditForm({ pet, petId }: { pet: Pet; petId: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { theme } = useUnistyles();
  const meta = CATEGORY_META[pet.category];

  const { mutate: updatePhoto } = useMutation({
    mutationFn: (asset: MediaAsset) => petsApi.updatePhoto(petId, asset.id),
    showSuccessToast: true,
    successMessage: t("petDetail.editPhoto"),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["pets", petId] });
    },
  });

  const form = useForm<PetEditValues>({
    schema: petEditSchema,
    defaultValues: {
      name: pet.name,
      speciesId: pet.speciesId ?? null,
      sex: pet.sex as Sex,
      birthDate: pet.birthDate ?? null,
      sterilized: pet.sterilized ?? null,
      notes: pet.notes ?? null,
    },
  });

  const speciesId = form.watch("speciesId");
  const [speciesInput, setSpeciesInput] = useState("");
  const [debouncedInput, setDebouncedInput] = useState("");
  const [speciesLabel, setSpeciesLabel] = useState(
    pet.speciesLabelFreetext ??
      (pet.speciesId ? t("petForm.speciesLabel") : ""),
  );

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedInput(speciesInput), 400);
    return () => clearTimeout(timer);
  }, [speciesInput]);

  const speciesQuery = useQuery({
    queryKey: ["species", pet.category, debouncedInput],
    queryFn: () =>
      petsApi
        .searchSpecies({ category: pet.category, q: debouncedInput, limit: 10 })
        .then((r) => r.data),
    enabled: debouncedInput.length >= 2,
  });

  const showSuggestions =
    debouncedInput.length >= 2 &&
    !speciesId &&
    (speciesQuery.data?.length ?? 0) > 0;

  function selectSpecies(s: SpeciesResult) {
    form.setValue("speciesId", s.id);
    setSpeciesLabel(s.commonName);
    setSpeciesInput("");
    setDebouncedInput("");
  }

  function clearSpecies() {
    form.setValue("speciesId", null);
    setSpeciesLabel("");
    setSpeciesInput("");
    setDebouncedInput("");
  }

  const { mutate, isPending } = useMutation({
    mutationFn: (values: PetEditValues) =>
      petsApi.update(petId, {
        name: values.name,
        speciesId: values.speciesId ?? null,
        sex: values.sex,
        birthDate: values.birthDate ?? null,
        sterilized: values.sterilized ?? null,
        notes: values.notes ?? null,
      }),
    showSuccessToast: true,
    successMessage: t("petForm.saveSuccess"),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["pets"] });
      void queryClient.invalidateQueries({ queryKey: ["pets", petId] });
      router.back();
    },
  });

  const submit = form.handleSubmit((values) => mutate(values));

  return (
    <>
      <ScreenHeader
        title={t("petForm.editTitle")}
        right={<SaveHeaderAction onPress={submit} disabled={isPending} />}
      />
      <FormProvider {...form}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.avatarWrapper, { backgroundColor: meta.tint }]}>
            <AvatarUploader
              name={pet.name}
              currentUrl={pet.photoUrl ?? null}
              context="PET_AVATAR"
              contextRef={`pet:${petId}`}
              onUploaded={updatePhoto}
              size="xl"
            />
          </View>

          <FormCard label={t("petForm.nameLabel")}>
            <FormInput<PetEditValues>
              name="name"
              placeholder={t("petForm.namePlaceholder")}
              autoCorrect={false}
            />
          </FormCard>

          <FormCard label={t("petForm.speciesLabel")}>
            {speciesId ? (
              <View style={styles.speciesSelected}>
                <Text style={styles.speciesSelectedText}>{speciesLabel}</Text>
                <NorboPressable
                  scale="row"
                  haptic="light"
                  onPress={clearSpecies}
                >
                  <IconSymbol
                    name="xmark.circle.fill"
                    size={18}
                    tintColor={theme.colors.textTertiary}
                  />
                </NorboPressable>
              </View>
            ) : (
              <TextInput
                placeholder={t("petForm.speciesPlaceholder")}
                value={speciesInput}
                onChangeText={(v: string) => {
                  setSpeciesInput(v);
                  form.setValue("speciesId", null);
                }}
                autoCorrect={false}
                autoCapitalize="none"
                style={styles.searchInput}
              />
            )}
            {showSuggestions && (
              <View style={styles.suggestions}>
                {(speciesQuery.data ?? []).map((s) => (
                  <NorboPressable
                    key={s.id}
                    style={styles.suggestion}
                    scale="row"
                    haptic="light"
                    onPress={() => selectSpecies(s)}
                  >
                    <Text style={styles.suggestionText}>{s.commonName}</Text>
                    {s.scientificName ? (
                      <Text style={styles.suggestionSci}>
                        {s.scientificName}
                      </Text>
                    ) : null}
                  </NorboPressable>
                ))}
              </View>
            )}
          </FormCard>

          <FormCard label={t("petForm.detailsLabel")}>
            <Text style={styles.fieldLabel}>{t("petForm.sexLabel")}</Text>
            <Controller
              name="sex"
              control={form.control}
              render={({ field }) => (
                <View style={styles.chips}>
                  {SEXES.map((s) => (
                    <NorboPressable
                      key={s}
                      style={[
                        styles.chip,
                        field.value === s && {
                          backgroundColor: theme.colors.primary,
                        },
                      ]}
                      scale="card"
                      haptic="light"
                      onPress={() => field.onChange(s)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          {
                            color:
                              field.value === s
                                ? theme.colors.textOnPrimary
                                : theme.colors.textSecondary,
                          },
                        ]}
                      >
                        {t(SEX_LABEL_KEYS[s])}
                      </Text>
                    </NorboPressable>
                  ))}
                </View>
              )}
            />
            <FormInput<PetEditValues>
              name="birthDate"
              label={t("petForm.birthDateLabel")}
              placeholder={t("petForm.birthDatePlaceholder")}
              keyboardType="numbers-and-punctuation"
            />
            <FormInput<PetEditValues>
              name="notes"
              label={t("petForm.notesLabel")}
              placeholder={t("petForm.notesPlaceholder")}
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
  avatarWrapper: {
    alignItems: "center",
    paddingVertical: theme.spacing["2xl"],
    borderRadius: theme.radius.xl,
    marginBottom: theme.spacing.sm,
  },
  scroll: {
    padding: theme.spacing["3xl"],
    paddingBottom: SCREEN_BOTTOM_PADDING,
    gap: theme.spacing.md,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  chip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface2,
  },
  chipText: {
    ...theme.typography.footnote,
  },
  fieldLabel: {
    ...theme.typography.footnote,
    color: theme.colors.primary,
    textTransform: "lowercase",
    letterSpacing: 0.8,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.xs,
  },
  speciesSelected: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: theme.spacing.sm,
  },
  speciesSelectedText: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
  },
  searchInput: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.pill,
  },
  suggestions: {
    marginTop: theme.spacing.xs,
    borderRadius: theme.radius.md,
    overflow: "hidden",
    borderWidth: theme.hairline,
    borderColor: theme.colors.border,
  },
  suggestion: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    gap: 2,
  },
  suggestionText: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
  },
  suggestionSci: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
    fontStyle: "italic",
  },
}));

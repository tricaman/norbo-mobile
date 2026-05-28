import { NorboPressable } from "@/components/CustomPressable";
import { DateField } from "@/components/ui/DateField";
import { FormCard } from "@/components/ui/FormCard";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Screen } from "@/components/ui/Screen";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { SCREEN_BOTTOM_PADDING } from "@/constants/layout";
import { useMutation } from "@/hooks/useMutation";
import { petsApi } from "@/services/pets.api";
import { queryClient } from "@/app/_layout";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, Text, TextInput, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { QueryBoundary } from "@/components/ui/QueryBoundary";
import type { Pet } from "@/types/pet.types";

type Step = "empathy" | "form" | "confirming";

export default function MemorialScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const petQuery = useQuery({
    queryKey: ["pets", id],
    queryFn: () => petsApi.get(id).then((r) => r.data),
    enabled: !!id,
  });

  return (
    <Screen>
      <QueryBoundary query={petQuery}>
        {(pet) => <MemorialFlow pet={pet} petId={id} />}
      </QueryBoundary>
    </Screen>
  );
}

function MemorialFlow({ pet, petId }: { pet: Pet; petId: string }) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const router = useRouter();
  const [step, setStep] = useState<Step>("empathy");
  const [deceasedDate, setDeceasedDate] = useState<Date | null>(null);
  const [note, setNote] = useState("");

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      petsApi.markDeceased(petId, {
        deceasedAt: deceasedDate ? format(deceasedDate, "yyyy-MM-dd") : undefined,
        note: note.trim() || undefined,
      }),
    showSuccessToast: true,
    successMessage: t("memorial.safeMessage", { name: pet.name }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["pets"] });
      void queryClient.invalidateQueries({ queryKey: ["pets", petId] });
      router.dismissAll();
    },
  });

  return (
    <>
      <ScreenHeader title="" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {step === "empathy" && (
          <View style={styles.empathyContainer}>
            <IconSymbol
              name="heart.fill"
              size={48}
              tintColor={theme.colors.textTertiary}
            />
            <Text
              style={[styles.empathyTitle, { color: theme.colors.textPrimary }]}
            >
              {t("memorial.empathyTitle")}
            </Text>
            <Text
              style={[
                styles.empathyMessage,
                { color: theme.colors.textSecondary },
              ]}
            >
              {t("memorial.empathyMessage", { name: pet.name })}
            </Text>
            <NorboPressable
              style={[styles.primaryBtn, { backgroundColor: theme.colors.primary }]}
              scale="row"
              haptic="medium"
              onPress={() => setStep("form")}
            >
              <Text
                style={[
                  styles.primaryBtnText,
                  { color: theme.colors.textOnPrimary },
                ]}
              >
                {t("memorial.continue")}
              </Text>
            </NorboPressable>
          </View>
        )}

        {step === "form" && (
          <View style={styles.formContainer}>
            <FormCard label={t("memorial.dateLabel")}>
              <DateField
                value={deceasedDate}
                onChange={setDeceasedDate}
                maximumDate={new Date()}
                placeholder={t("memorial.datePlaceholder")}
              />
            </FormCard>

            <FormCard label={t("memorial.noteLabel")}>
              <TextInput
                style={[
                  styles.noteInput,
                  {
                    color: theme.colors.textPrimary,
                    backgroundColor: theme.colors.surface,
                  },
                ]}
                placeholder={t("memorial.notePlaceholder")}
                placeholderTextColor={theme.colors.textTertiary}
                value={note}
                onChangeText={setNote}
                multiline
                numberOfLines={4}
                maxLength={2000}
                textAlignVertical="top"
              />
            </FormCard>

            <NorboPressable
              style={[styles.primaryBtn, { backgroundColor: theme.colors.primary }]}
              scale="row"
              haptic="medium"
              disabled={isPending}
              onPress={() => {
                setStep("confirming");
                mutate();
              }}
            >
              <Text
                style={[
                  styles.primaryBtnText,
                  { color: theme.colors.textOnPrimary },
                ]}
              >
                {t("memorial.confirm")}
              </Text>
            </NorboPressable>
          </View>
        )}

        {step === "confirming" && (
          <View style={styles.empathyContainer}>
            <IconSymbol
              name="heart.fill"
              size={48}
              tintColor={theme.colors.textTertiary}
            />
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create((theme) => ({
  scroll: {
    flexGrow: 1,
    padding: theme.spacing["3xl"],
    paddingBottom: SCREEN_BOTTOM_PADDING,
  },
  empathyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing["4xl"],
    gap: theme.spacing.lg,
  },
  empathyTitle: {
    ...theme.typography.title2,
    fontWeight: "600",
    textAlign: "center",
  },
  empathyMessage: {
    ...theme.typography.body,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: theme.spacing.lg,
  },
  formContainer: {
    gap: theme.spacing.md,
  },
  noteInput: {
    ...theme.typography.body,
    minHeight: 100,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.md,
  },
  primaryBtn: {
    alignSelf: "stretch",
    alignItems: "center",
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.pill,
    marginTop: theme.spacing.lg,
  },
  primaryBtnText: {
    ...theme.typography.body,
    fontWeight: "600",
  },
}));

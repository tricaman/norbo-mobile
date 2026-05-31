import { NorboPressable } from "@/components/CustomPressable";
import { FormCard } from "@/components/ui/FormCard";
import { FormInput } from "@/components/ui/FormInput";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { SCREEN_BOTTOM_PADDING } from "@/constants/layout";
import React from "react";
import { FormProvider, type UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { z } from "zod";

export const albumFormSchema = z.object({
  title: z.string().min(1, "required").max(120),
  description: z.string().max(500).nullable().optional(),
});

export type AlbumFormValues = z.infer<typeof albumFormSchema>;

interface AlbumFormProps {
  form: UseFormReturn<AlbumFormValues>;
  isSubmitting: boolean;
  submitLabel: string;
  onSubmit: (values: AlbumFormValues) => void;
}

export function AlbumForm({
  form,
  isSubmitting,
  submitLabel,
  onSubmit,
}: AlbumFormProps): React.JSX.Element {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const insets = useSafeAreaInsets();

  const handleSubmit = form.handleSubmit(onSubmit);

  return (
    <FormProvider {...form}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scroll}
        >
          <SectionLabel style={styles.sectionLabel}>
            {t("photoAlbums.titleLabel")}
          </SectionLabel>
          <FormCard style={styles.card}>
            <FormInput
              name="title"
              placeholder={t("photoAlbums.titlePlaceholder")}
              returnKeyType="next"
            />
          </FormCard>

          <SectionLabel style={styles.sectionLabel}>
            {t("photoAlbums.descriptionLabel")}
          </SectionLabel>
          <FormCard style={styles.card}>
            <FormInput
              name="description"
              placeholder={t("photoAlbums.descriptionPlaceholder")}
              multiline
              numberOfLines={3}
              returnKeyType="done"
            />
          </FormCard>
        </ScrollView>

        <View
          style={[
            styles.bottomBar,
            { paddingBottom: SCREEN_BOTTOM_PADDING + insets.bottom },
          ]}
        >
          <NorboPressable
            style={[
              styles.submitBtn,
              {
                backgroundColor: isSubmitting
                  ? theme.colors.border
                  : theme.colors.primary,
              },
            ]}
            haptic="medium"
            disabled={isSubmitting}
            onPress={() => {
              void handleSubmit();
            }}
          >
            <Text
              style={[styles.submitLabel, { color: theme.colors.textOnPrimary }]}
            >
              {submitLabel}
            </Text>
          </NorboPressable>
        </View>
      </KeyboardAvoidingView>
    </FormProvider>
  );
}

const styles = StyleSheet.create((theme) => ({
  flex: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
  sectionLabel: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xs,
  },
  card: {
    marginBottom: 0,
  },
  bottomBar: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  submitBtn: {
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.pill,
    alignItems: "center",
  },
  submitLabel: {
    ...theme.typography.subhead,
    fontWeight: "700",
  },
}));

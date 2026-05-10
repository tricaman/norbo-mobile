import React from "react";
import { TextInput, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { useTranslation } from "react-i18next";
import type { PetCategory } from "@/types/pet.types";
import { NAME_SUGGESTIONS } from "../category-meta";
import { PetStepHeading } from "../PetStepHeading";
import { PetSuggestionChips } from "../PetSuggestionChips";
import { PetWizardButton } from "../PetWizardButton";
import { PetWizardHero } from "../PetWizardHero";
import { PetWizardLayout } from "../PetWizardLayout";
import { TOTAL_FORM_STEPS } from "../wizard.types";

interface NameStepProps {
  category: PetCategory;
  value: string;
  onChange: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

/**
 * NameStep — first form step. Required field. No "skip" because the
 * pet must have a name. Below the input, quick-pick chips offer
 * curated common names per category to make first-time use feel
 * effortless.
 */
export function NameStep({
  category,
  value,
  onChange,
  onNext,
  onBack,
}: NameStepProps) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();

  const trimmed = value.trim();
  const canContinue = trimmed.length > 0;

  return (
    <PetWizardLayout
      step={1}
      leading="back"
      onLeadingPress={onBack}
      footer={
        <PetWizardButton
          label={t("petWizard.continue")}
          onPress={onNext}
          disabled={!canContinue}
          trailingChevron
        />
      }
    >
      <PetWizardHero
        category={category}
        badge={t("petWizard.stepCounter", {
          current: "1",
          total: String(TOTAL_FORM_STEPS),
          category: t(`petForm.categories.${category}`),
        })}
      />

      <PetStepHeading
        title={t("petWizard.nameTitle")}
        subtitle={t("petWizard.nameSubtitle")}
      />

      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={t("petWizard.namePlaceholder")}
        placeholderTextColor={theme.colors.textTertiary}
        autoFocus
        autoCorrect={false}
        autoCapitalize="words"
        returnKeyType="next"
        onSubmitEditing={() => {
          if (canContinue) onNext();
        }}
        style={styles.input}
      />

      <View style={styles.suggestionWrap}>
        <PetSuggestionChips
          suggestions={NAME_SUGGESTIONS[category]}
          onSelect={onChange}
        />
      </View>
    </PetWizardLayout>
  );
}

const styles = StyleSheet.create((theme) => ({
  input: {
    ...theme.typography.title2,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    textAlign: "center",
  },
  suggestionWrap: {
    paddingTop: theme.spacing.xs,
  },
}));

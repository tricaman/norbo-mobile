import React from "react";
import { Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { useTranslation } from "react-i18next";
import { PetCategory } from "@/types/pet.types";
import { PetCategoryCard } from "../PetCategoryCard";
import { PetWizardButton } from "../PetWizardButton";
import { PetWizardLayout } from "../PetWizardLayout";

const CATEGORIES = Object.values(PetCategory);

interface CategoryStepProps {
  value: PetCategory | undefined;
  onChange: (value: PetCategory) => void;
  onNext: () => void;
  onClose: () => void;
}

/**
 * CategoryStep — entry point of the pet wizard. Renders a 2-column
 * grid of `PetCategoryCard`s. Mirrors the leftmost mockup screen.
 */
export function CategoryStep({
  value,
  onChange,
  onNext,
  onClose,
}: CategoryStepProps) {
  const { t } = useTranslation();

  const continueLabel = value
    ? t("petWizard.continueWith", {
        category: t(`petForm.categories.${value}`),
      })
    : t("petWizard.continue");

  return (
    <PetWizardLayout
      step={0}
      leading="close"
      onLeadingPress={onClose}
      footer={
        <PetWizardButton
          label={continueLabel}
          onPress={onNext}
          disabled={!value}
        />
      }
    >
      <View style={styles.heading}>
        <Text style={styles.title}>{t("petWizard.categoryTitle")}</Text>
        <Text style={styles.subtitle}>{t("petWizard.categorySubtitle")}</Text>
      </View>

      <View style={styles.grid}>
        {pairs(CATEGORIES).map((row, rowIdx) => (
          <View key={rowIdx} style={styles.row}>
            {row.map((cat) => (
              <PetCategoryCard
                key={cat}
                category={cat}
                selected={value === cat}
                title={t(`petForm.categories.${cat}`)}
                tagline={t(`petWizard.taglines.${cat}`)}
                onPress={() => onChange(cat)}
              />
            ))}
            {row.length === 1 ? <View style={styles.spacer} /> : null}
          </View>
        ))}
      </View>
    </PetWizardLayout>
  );
}

/** Splits a flat list into [a, b] pairs for the 2-column grid layout. */
function pairs<T>(arr: readonly T[]): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += 2) {
    out.push(arr.slice(i, i + 2));
  }
  return out;
}

const styles = StyleSheet.create((theme) => ({
  heading: {
    gap: theme.spacing.xs,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
  },
  title: {
    ...theme.typography.title1,
    color: theme.colors.textPrimary,
  },
  subtitle: {
    ...theme.typography.footnote,
    color: theme.colors.textSecondary,
  },
  grid: {
    gap: theme.spacing.md,
  },
  row: {
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  spacer: {
    flex: 1,
  },
}));

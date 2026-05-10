import { NorboPressable } from "@/components/CustomPressable";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { petsApi } from "@/services/pets.api";
import type { PetCategory, SpeciesResult } from "@/types/pet.types";
import { useQuery } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import { Text, TextInput, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { useTranslation } from "react-i18next";
import { PetStepHeading } from "../PetStepHeading";
import { PetWizardButton } from "../PetWizardButton";
import { PetWizardHero } from "../PetWizardHero";
import { PetWizardLayout } from "../PetWizardLayout";
import { TOTAL_FORM_STEPS } from "../wizard.types";

interface SpeciesStepProps {
  category: PetCategory;
  speciesId: string | null | undefined;
  speciesLabel: string | undefined;
  onChange: (next: { id: string | null; label: string | null }) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

const DEBOUNCE_MS = 350;

/**
 * SpeciesStep — debounced search-and-select for the species/breed
 * field. Skippable. Once a species is selected, the input is replaced
 * with a confirmation card that allows clearing the selection.
 */
export function SpeciesStep({
  category,
  speciesId,
  speciesLabel,
  onChange,
  onNext,
  onBack,
  onSkip,
}: SpeciesStepProps) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();

  const [input, setInput] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const id = setTimeout(() => setDebounced(input), DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [input]);

  const query = useQuery({
    queryKey: ["species", category, debounced],
    queryFn: () =>
      petsApi
        .searchSpecies({ category, q: debounced, limit: 10 })
        .then((r) => r.data),
    enabled: !speciesId && debounced.length >= 2,
  });

  const showSuggestions = !speciesId && debounced.length >= 2;
  const results = query.data ?? [];

  function selectResult(s: SpeciesResult) {
    onChange({ id: s.id, label: s.commonName });
    setInput("");
    setDebounced("");
  }

  function clearSelection() {
    onChange({ id: null, label: null });
  }

  return (
    <PetWizardLayout
      step={2}
      leading="back"
      onLeadingPress={onBack}
      canSkip={!speciesId}
      onSkip={onSkip}
      skipLabel={t("petWizard.skip")}
      footer={
        <PetWizardButton
          label={t("petWizard.continue")}
          onPress={onNext}
          trailingChevron
        />
      }
    >
      <PetWizardHero
        category={category}
        badge={t("petWizard.stepCounter", {
          current: "2",
          total: String(TOTAL_FORM_STEPS),
          category: t(`petForm.categories.${category}`),
        })}
      />

      <PetStepHeading
        title={t("petWizard.speciesTitle")}
        subtitle={t("petWizard.speciesSubtitle")}
      />

      {speciesId ? (
        <View style={styles.selectedCard}>
          <View style={styles.selectedTextWrap}>
            <Text style={styles.selectedLabel}>
              {t("petWizard.speciesSelected")}
            </Text>
            <Text style={styles.selectedValue}>{speciesLabel}</Text>
          </View>
          <NorboPressable
            scale="row"
            haptic="light"
            onPress={clearSelection}
            style={styles.clearBtn}
          >
            <Text style={styles.clearText}>{t("petWizard.speciesChange")}</Text>
          </NorboPressable>
        </View>
      ) : (
        <View style={styles.searchWrap}>
          <IconSymbol
            name="magnifyingglass"
            size={18}
            tintColor={theme.colors.textTertiary}
          />
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={t("petWizard.speciesPlaceholder")}
            placeholderTextColor={theme.colors.textTertiary}
            autoCorrect={false}
            autoCapitalize="none"
            style={styles.searchInput}
          />
        </View>
      )}

      {showSuggestions && results.length > 0 ? (
        <View style={styles.suggestionList}>
          {results.map((s, i) => (
            <NorboPressable
              key={s.id}
              scale="row"
              haptic="light"
              onPress={() => selectResult(s)}
              style={[
                styles.suggestion,
                i === 0 && styles.suggestionFirst,
                i === results.length - 1 && styles.suggestionLast,
              ]}
            >
              <Text style={styles.suggestionTitle}>{s.commonName}</Text>
              {s.scientificName ? (
                <Text style={styles.suggestionSubtitle}>{s.scientificName}</Text>
              ) : null}
            </NorboPressable>
          ))}
        </View>
      ) : null}

      {showSuggestions && !query.isPending && results.length === 0 ? (
        <Text style={styles.empty}>{t("petWizard.speciesEmpty")}</Text>
      ) : null}
    </PetWizardLayout>
  );
}

const styles = StyleSheet.create((theme) => ({
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.lg,
    borderWidth: theme.hairline,
    borderColor: theme.colors.border,
  },
  searchInput: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    flex: 1,
    paddingVertical: theme.spacing.md,
  },
  suggestionList: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: theme.hairline,
    borderColor: theme.colors.border,
    overflow: "hidden",
  },
  suggestion: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderTopWidth: theme.hairline,
    borderTopColor: theme.colors.border,
    gap: 2,
  },
  suggestionFirst: {
    borderTopWidth: 0,
  },
  suggestionLast: {},
  suggestionTitle: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
  },
  suggestionSubtitle: {
    ...theme.typography.footnote,
    color: theme.colors.textTertiary,
    fontStyle: "italic",
  },
  empty: {
    ...theme.typography.footnote,
    color: theme.colors.textTertiary,
    textAlign: "center",
    paddingVertical: theme.spacing.md,
  },
  selectedCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  selectedTextWrap: {
    flex: 1,
    gap: 2,
  },
  selectedLabel: {
    ...theme.typography.footnote,
    color: theme.colors.primary,
    textTransform: "lowercase",
  },
  selectedValue: {
    ...theme.typography.subhead,
    color: theme.colors.textPrimary,
  },
  clearBtn: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  clearText: {
    ...theme.typography.footnote,
    color: theme.colors.textSecondary,
  },
}));

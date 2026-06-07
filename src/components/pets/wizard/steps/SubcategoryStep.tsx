import { NorboPressable } from "@/components/CustomPressable";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { petsApi } from "@/services/pets.api";
import type { PetCategory, SubcategoryResult } from "@/types/pet.types";
import { useQuery } from "@tanstack/react-query";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Text, TextInput, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { useTranslation } from "react-i18next";
import { PetStepHeading } from "../PetStepHeading";
import { PetWizardHero } from "../PetWizardHero";
import { PetWizardLayout } from "../PetWizardLayout";
import { TOTAL_FORM_STEPS } from "../wizard.types";

interface SubcategoryStepProps {
  category: PetCategory;
  /** Set the selection and advance to the species step. */
  onSelect: (sub: { id: string; label: string }) => void;
  /**
   * Called once the kinds load for a single-kind category (dog, cat, …):
   * the lone kind (or none) is auto-applied and the step is skipped.
   */
  onAutoSkip: (single: SubcategoryResult | null) => void;
  onBack: () => void;
}

const DEBOUNCE_MS = 300;

/**
 * SubcategoryStep — pick the "kind" of animal (Rabbit, Hamster, …) before
 * the species/breed. Browses on entry and filters as you type. Categories
 * with a single kind (dog, cat) never render: the kind is auto-applied via
 * `onAutoSkip` and the wizard jumps straight to the species step. Shares
 * the "species" progress position — it is the same "which animal" stage.
 */
export function SubcategoryStep({
  category,
  onSelect,
  onAutoSkip,
  onBack,
}: SubcategoryStepProps) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();

  const [input, setInput] = useState("");
  const [debounced, setDebounced] = useState("");
  const autoSkipped = useRef(false);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(input), DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [input]);

  // Unfiltered fetch drives the auto-skip decision; the filtered query
  // below powers the visible list once we know the category has >1 kind.
  const baseQuery = useQuery({
    queryKey: ["subcategories", category, ""],
    queryFn: () =>
      petsApi.searchSubcategories({ category }).then((r) => r.data),
  });

  const isSingleKind =
    baseQuery.data !== undefined && baseQuery.data.length <= 1;

  useEffect(() => {
    if (autoSkipped.current || baseQuery.data === undefined) return;
    if (baseQuery.data.length <= 1) {
      autoSkipped.current = true;
      onAutoSkip(baseQuery.data[0] ?? null);
    }
  }, [baseQuery.data, onAutoSkip]);

  const listQuery = useQuery({
    queryKey: ["subcategories", category, debounced],
    queryFn: () =>
      petsApi
        .searchSubcategories({ category, q: debounced })
        .then((r) => r.data),
    enabled: debounced.length >= 2 && !isSingleKind,
  });

  const results =
    debounced.length >= 2 ? (listQuery.data ?? []) : (baseQuery.data ?? []);

  // Single-kind categories render nothing — `onAutoSkip` advances the wizard.
  if (baseQuery.isPending || isSingleKind) {
    return (
      <PetWizardLayout step={2} leading="back" onLeadingPress={onBack}>
        <View style={styles.loading}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      </PetWizardLayout>
    );
  }

  return (
    <PetWizardLayout step={2} leading="back" onLeadingPress={onBack}>
      <PetWizardHero
        category={category}
        badge={t("petWizard.stepCounter", {
          current: "2",
          total: String(TOTAL_FORM_STEPS),
          category: t(`petForm.categories.${category}`),
        })}
      />

      <PetStepHeading
        title={t("petWizard.subcategoryTitle")}
        subtitle={t("petWizard.subcategorySubtitle")}
      />

      <View style={styles.searchWrap}>
        <IconSymbol
          name="magnifyingglass"
          size={18}
          tintColor={theme.colors.textTertiary}
        />
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder={t("petWizard.subcategoryPlaceholder")}
          placeholderTextColor={theme.colors.textTertiary}
          autoCorrect={false}
          style={styles.searchInput}
        />
      </View>

      {results.length > 0 ? (
        <View style={styles.list}>
          {results.map((s, i) => (
            <NorboPressable
              key={s.id}
              scale="row"
              haptic="light"
              onPress={() => onSelect({ id: s.id, label: s.commonName })}
              style={[
                styles.row,
                i === 0 && styles.rowFirst,
                i === results.length - 1 && styles.rowLast,
              ]}
            >
              <Text style={styles.rowTitle}>{s.commonName}</Text>
              <IconSymbol
                name="chevron.right"
                size={16}
                tintColor={theme.colors.textTertiary}
              />
            </NorboPressable>
          ))}
        </View>
      ) : (
        <Text style={styles.empty}>{t("petWizard.subcategoryEmpty")}</Text>
      )}
    </PetWizardLayout>
  );
}

const styles = StyleSheet.create((theme) => ({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.xl,
  },
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
  list: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: theme.hairline,
    borderColor: theme.colors.border,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderTopWidth: theme.hairline,
    borderTopColor: theme.colors.border,
  },
  rowFirst: {
    borderTopWidth: 0,
  },
  rowLast: {},
  rowTitle: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
  },
  empty: {
    ...theme.typography.footnote,
    color: theme.colors.textTertiary,
    textAlign: "center",
    paddingVertical: theme.spacing.md,
  },
}));

import { NorboPressable } from "@/components/CustomPressable";
import { PetCategory } from "@/types/pet.types";
import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, Text } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

const ALL_CATEGORIES = Object.values(PetCategory);

/**
 * ToolCategoryPicker — tool-local horizontal chip picker for an animal
 * category (for tools that take a category as input rather than a registered
 * pet). Reuses the app's `petForm.categories.*` labels. Not a design-system
 * primitive — lives in the tools feature.
 */
export function ToolCategoryPicker({
  value,
  onChange,
  categories = ALL_CATEGORIES,
}: {
  value: PetCategory;
  onChange: (category: PetCategory) => void;
  categories?: PetCategory[];
}): React.JSX.Element {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.track}
    >
      {categories.map((cat) => {
        const selected = cat === value;
        return (
          <NorboPressable
            key={cat}
            scale="text"
            haptic="light"
            onPress={() => onChange(cat)}
            style={[
              styles.chip,
              selected && {
                backgroundColor: theme.colors.primarySoft,
                borderColor: theme.colors.primary,
              },
            ]}
          >
            <Text
              style={[
                styles.label,
                {
                  color: selected
                    ? theme.colors.textPrimary
                    : theme.colors.textSecondary,
                },
              ]}
            >
              {t(`petForm.categories.${cat}` as never)}
            </Text>
          </NorboPressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create((theme) => ({
  track: {
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  chip: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface,
    borderWidth: theme.hairline,
    borderColor: theme.colors.border,
  },
  label: {
    ...theme.typography.footnote,
  },
}));

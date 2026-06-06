import type { PetCategory } from "@/types/pet.types";
import React from "react";
import { Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { CATEGORY_META } from "./category-meta";
import { PetCategoryIcon } from "./PetCategoryIcon";

interface PetWizardHeroProps {
  category: PetCategory;
  /** Step counter pill text, e.g. "1 di 5 · Cane". */
  badge: string;
}

/**
 * PetWizardHero — colored card displayed at the top of every form
 * step. Reproduces the mockup: tinted background tied to the chosen
 * category, large translucent icon on the right, small dark counter
 * pill in the top-left.
 */
export function PetWizardHero({ category, badge }: PetWizardHeroProps) {
  const { theme } = useUnistyles();
  const meta = CATEGORY_META[category];

  return (
    <View style={[styles.card, { backgroundColor: meta.tint }]}>
      <View style={[styles.badge, { backgroundColor: theme.colors.surface }]}>
        <Text style={styles.badgeText}>{badge}</Text>
      </View>

      <View style={styles.iconWrap} pointerEvents="none">
        <PetCategoryIcon
          category={category}
          size={120}
          color={theme.colors.textOnPrimary}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    height: 140,
    overflow: "hidden",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    justifyContent: "space-between",
    ...theme.card,
    borderRadius: theme.radius.xl,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
  },
  badgeText: {
    ...theme.typography.footnote,
    color: theme.colors.textPrimary,
    fontWeight: "500",
  },
  iconWrap: {
    position: "absolute",
    right: 10,
    bottom: -8,
    opacity: 0.85,
  },
}));

import { NorboPressable } from "@/components/CustomPressable";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { PetCategoryIcon } from "@/components/pets/wizard/PetCategoryIcon";
import { CATEGORY_META } from "@/components/pets/wizard/category-meta";
import React from "react";
import { Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { PetCategory } from "@/types/pet.types";

interface PetsEmptyHeroProps {
  title: string;
  subtitle: string;
  ctaLabel: string;
  onPressCta: () => void;
}

/**
 * PetsEmptyHero — premium empty state for the pets tab.
 *
 * Stacks three category-tinted squircles (dog / cat / fish) overlapping
 * with a slight rotation, evoking iOS app icons. Below sits a copy
 * block and a primary pill CTA. Replaces the generic `EmptyState` for
 * the pets list so first-time users land on a welcoming visual rather
 * than a flat message.
 */
export function PetsEmptyHero({
  title,
  subtitle,
  ctaLabel,
  onPressCta,
}: PetsEmptyHeroProps) {
  const { theme } = useUnistyles();

  return (
    <View style={styles.container}>
      <View style={styles.iconStack}>
        <View
          style={[
            styles.icon,
            styles.iconBack,
            { backgroundColor: CATEGORY_META[PetCategory.MAMMAL_CAT].tint },
          ]}
        >
          <PetCategoryIcon
            category={PetCategory.MAMMAL_CAT}
            size={42}
            color={theme.colors.textOnPrimary}
          />
        </View>
        <View
          style={[
            styles.icon,
            styles.iconRight,
            { backgroundColor: CATEGORY_META[PetCategory.MAMMAL_DOG].tint },
          ]}
        >
          <PetCategoryIcon
            category={PetCategory.MAMMAL_DOG}
            size={42}
            color={theme.colors.textOnPrimary}
          />
        </View>
        <View
          style={[
            styles.icon,
            styles.iconFront,
            {
              backgroundColor: CATEGORY_META[PetCategory.FISH_FRESHWATER].tint,
            },
          ]}
        >
          <PetCategoryIcon
            category={PetCategory.FISH_FRESHWATER}
            size={42}
            color={theme.colors.textOnPrimary}
          />
        </View>
      </View>

      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      <NorboPressable
        scale="cta"
        haptic="medium"
        onPress={onPressCta}
        style={[styles.cta, { backgroundColor: theme.colors.primary }]}
      >
        <View style={styles.ctaInner}>
          <IconSymbol
            name="plus"
            size={18}
            tintColor={theme.colors.textOnPrimary}
          />
          <Text style={styles.ctaText}>{ctaLabel}</Text>
        </View>
      </NorboPressable>
    </View>
  );
}

const ICON_SIZE = 88;

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing["3xl"],
    paddingTop: theme.spacing["3xl"],
    gap: theme.spacing["2xl"],
  },
  iconStack: {
    width: ICON_SIZE * 2,
    height: ICON_SIZE * 1.6,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    position: "absolute",
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBack: {
    transform: [{ translateX: -ICON_SIZE * 0.5 }, { rotate: "-12deg" }],
    top: 0,
  },
  iconRight: {
    transform: [{ translateX: ICON_SIZE * 0.55 }, { rotate: "10deg" }],
    top: ICON_SIZE * 0.1,
  },
  iconFront: {
    transform: [{ translateY: ICON_SIZE * 0.4 }, { rotate: "-2deg" }],
  },
  text: {
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  title: {
    ...theme.typography.title2,
    color: theme.colors.textPrimary,
    textAlign: "center",
  },
  subtitle: {
    ...theme.typography.footnote,
    color: theme.colors.textSecondary,
    textAlign: "center",
  },
  cta: {
    borderRadius: theme.radius.pill,
  },
  ctaInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
  },
  ctaText: {
    ...theme.typography.subhead,
    fontWeight: "600",
    color: theme.colors.textOnPrimary,
  },
}));

import { NorboPressable } from "@/components/CustomPressable";
import { IconSymbol } from "@/components/ui/IconSymbol";
import type { PetCategory } from "@/types/pet.types";
import React from "react";
import { Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { CATEGORY_META } from "./category-meta";
import { PetCategoryIcon } from "./PetCategoryIcon";

interface PetCategoryCardProps {
  category: PetCategory;
  selected: boolean;
  title: string;
  tagline: string;
  onPress: () => void;
}

/**
 * PetCategoryCard — selectable card on the category step.
 *
 * Selected state renders a primary border and a check badge in the
 * top-right corner; the icon sits inside a small tinted squircle so
 * each category is instantly recognisable, in the spirit of an iOS
 * app icon. Layout matches the mockup grid (2 cards per row).
 */
export function PetCategoryCard({
  category,
  selected,
  title,
  tagline,
  onPress,
}: PetCategoryCardProps) {
  const { theme } = useUnistyles();
  const meta = CATEGORY_META[category];

  return (
    <NorboPressable
      style={[
        styles.card,
        selected && {
          borderColor: theme.colors.primary,
          backgroundColor: theme.colors.primarySoft,
        },
      ]}
      scale="card"
      haptic="light"
      onPress={onPress}
    >
      {selected ? (
        <View style={[styles.badge, { backgroundColor: theme.colors.primary }]}>
          <IconSymbol
            name="checkmark"
            size={12}
            tintColor={theme.colors.textOnPrimary}
          />
        </View>
      ) : null}

      <View style={[styles.iconWrap, { backgroundColor: meta.tint }]}>
        <PetCategoryIcon
          category={category}
          size={22}
          color={theme.colors.textOnPrimary}
        />
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.tagline} numberOfLines={1}>
        {tagline}
      </Text>
    </NorboPressable>
  );
}

const CARD_RADIUS = 18;

const styles = StyleSheet.create((theme) => ({
  card: {
    flex: 1,
    minHeight: 116,
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    ...theme.card,
    borderRadius: CARD_RADIUS,
    gap: theme.spacing.xs,
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.xs,
  },
  title: {
    ...theme.typography.subhead,
    color: theme.colors.textPrimary,
  },
  tagline: {
    ...theme.typography.footnote,
    color: theme.colors.textTertiary,
  },
}));

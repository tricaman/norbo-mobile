import { Card } from "@/components/ui/Card";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { CATEGORY_META } from "@/components/pets/wizard/category-meta";
import { PetCategoryIcon } from "@/components/pets/wizard/PetCategoryIcon";
import type { PetCategory } from "@/types/pet.types";
import React from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

interface CategoryToolsCardProps {
  category: PetCategory;
  /** Resolved category/species label, e.g. "dog" or "rabbit". */
  label: string;
  toolCount: number;
  /** Representative pet of the category — its initial badges the tile and its
   *  name fills the "prefilled for …" subtitle. */
  petName: string;
  onPress: () => void;
}

/**
 * CategoryToolsCard — the "for your dog" / "for your cat" entry in the Services
 * hub. A pressable `Card` whose chrome comes from the shared parent; only the
 * tinted category tile + pet badge are local. Opens the per-category tools
 * screen.
 */
export function CategoryToolsCard({
  category,
  label,
  toolCount,
  petName,
  onPress,
}: CategoryToolsCardProps): React.JSX.Element {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const initial = petName.charAt(0).toUpperCase() || "?";

  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={[styles.tile, { backgroundColor: CATEGORY_META[category].tint }]}>
        <PetCategoryIcon
          category={category}
          size={28}
          color="rgba(255,255,255,0.92)"
        />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{initial}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {t("servicesHub.forYourPet", { label })}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {`${t("servicesHub.toolCount", { count: toolCount })} · ${t(
            "servicesHub.prefilledFor",
            { name: petName },
          )}`}
        </Text>
      </View>

      <IconSymbol
        name="chevron.right"
        size={14}
        tintColor={theme.colors.textTertiary}
      />
    </Card>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },
  tile: {
    width: 52,
    height: 52,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 4,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface2,
    borderWidth: 2,
    borderColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textTransform: "none",
  },
  content: { flex: 1, gap: 3 },
  title: {
    ...theme.typography.subhead,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    textTransform: "lowercase",
  },
  subtitle: {
    ...theme.typography.footnote,
    color: theme.colors.textSecondary,
  },
}));

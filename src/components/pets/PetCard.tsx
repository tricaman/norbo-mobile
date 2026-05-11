import { NorboPressable } from "@/components/CustomPressable";
import { PetCategoryIcon } from "@/components/pets/wizard/PetCategoryIcon";
import { CATEGORY_META } from "@/components/pets/wizard/category-meta";
import type { Pet } from "@/types/pet.types";
import { differenceInMonths, differenceInYears, parseISO } from "date-fns";
import { Image } from "expo-image";
import React from "react";
import { Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { useTranslation } from "react-i18next";

interface PetCardProps {
  pet: Pet;
  onPress: () => void;
}

/**
 * PetCard — two-section card matching the Home mockup.
 *
 * Top: square image area with category tint (or pet photo), large
 * translucent icon centred, age badge bottom-left.
 * Bottom: white surface info section with pet name + species label.
 *
 * Shadow is on the outer NorboPressable (no overflow:hidden) so it
 * renders correctly on iOS. An inner View clips the image to the
 * rounded corners.
 */
export function PetCard({ pet, onPress }: PetCardProps) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const meta = CATEGORY_META[pet.category];

  function ageLabel(): string | null {
    if (!pet.birthDate) return null;
    const birth = parseISO(pet.birthDate);
    const now = new Date();
    const years = differenceInYears(now, birth);
    if (years >= 1) {
      return `${years} ${t(years === 1 ? "petDetail.ageYear" : "petDetail.ageYears")}`;
    }
    const months = differenceInMonths(now, birth);
    if (months < 1) return null;
    return `${months} ${t(months === 1 ? "petDetail.ageMonth" : "petDetail.ageMonths")}`;
  }

  const age = ageLabel();
  const speciesLabel =
    pet.speciesLabelFreetext ?? t(`petForm.categories.${pet.category}`);

  return (
    <NorboPressable
      scale="card"
      haptic="light"
      onPress={onPress}
      style={styles.shadow}
    >
      {/* Inner view clips everything to rounded corners */}
      <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        {/* ── Image area ──────────────────────────── */}
        <View style={[styles.imageArea, { backgroundColor: meta.tint }]}>
          {pet.photoUrl ? (
            <Image
              source={{ uri: pet.photoUrl }}
              style={styles.photo}
              contentFit="cover"
            />
          ) : null}

          <PetCategoryIcon
            category={pet.category}
            size={88}
            color="rgba(255,255,255,0.30)"
          />

          {age ? (
            <View style={styles.ageBadge}>
              <Text style={styles.ageBadgeText}>{age}</Text>
            </View>
          ) : null}
        </View>

        {/* ── Info area ───────────────────────────── */}
        <View style={styles.infoArea}>
          <Text
            style={[styles.name, { color: theme.colors.textPrimary }]}
            numberOfLines={1}
          >
            {pet.name}
          </Text>
          <Text
            style={[styles.species, { color: theme.colors.textSecondary }]}
            numberOfLines={1}
          >
            {speciesLabel}
          </Text>
        </View>
      </View>
    </NorboPressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  shadow: {
    flex: 1,
    borderRadius: theme.radius.xl,
    shadowColor: theme.colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  card: {
    flex: 1,
    borderRadius: theme.radius.xl,
    overflow: "hidden",
  },
  imageArea: {
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  photo: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  ageBadge: {
    position: "absolute",
    bottom: theme.spacing.sm,
    left: theme.spacing.sm,
    backgroundColor: "rgba(0,0,0,0.38)",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3,
    borderRadius: theme.radius.pill,
  },
  ageBadgeText: {
    ...theme.typography.caption,
    color: theme.colors.textOnPrimary,
    fontWeight: "600",
  },
  infoArea: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
    gap: 2,
  },
  name: {
    ...theme.typography.subhead,
    fontWeight: "700",
  },
  species: {
    ...theme.typography.caption,
  },
}));

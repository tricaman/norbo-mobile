import { NorboPressable } from "@/components/CustomPressable";
import { Avatar } from "@/components/ui/Avatar";
import type { Pet } from "@/types/pet.types";
import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

interface PetFilterChipsProps {
  pets: Pet[];
  /** Selected pet ids. Empty array = "all pets". */
  selected: string[];
  onChange: (selected: string[]) => void;
}

/**
 * PetFilterChips — horizontal scroll of pet avatars + "Tutti i pet".
 *
 * - Tap "Tutti i pet" → clears the filter.
 * - Tap a pet chip → toggles that pet in the selection. As soon as the
 *   user picks at least one pet the "Tutti" chip becomes inactive.
 */
export function PetFilterChips({
  pets,
  selected,
  onChange,
}: PetFilterChipsProps): React.ReactElement {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const isAll = selected.length === 0;

  const togglePet = (petId: string): void => {
    if (selected.includes(petId)) {
      onChange(selected.filter((id) => id !== petId));
    } else {
      onChange([...selected, petId]);
    }
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      <NorboPressable
        scale="row"
        haptic="light"
        onPress={() => onChange([])}
        style={[
          styles.allChip,
          {
            backgroundColor: isAll
              ? theme.colors.primarySoft
              : "transparent",
            borderColor: isAll
              ? theme.colors.primaryBorder
              : theme.colors.border,
          },
        ]}
      >
        <Text
          style={[
            styles.allLabel,
            {
              color: isAll ? theme.colors.primary : theme.colors.textTertiary,
            },
          ]}
        >
          {t("expenses.petAll")}
        </Text>
      </NorboPressable>

      {pets.map((pet) => {
        const isActive = selected.includes(pet.id);
        return (
          <NorboPressable
            key={pet.id}
            scale="row"
            haptic="light"
            onPress={() => togglePet(pet.id)}
            style={[
              styles.petChip,
              {
                backgroundColor: isActive
                  ? theme.colors.primarySoft
                  : "transparent",
                borderColor: isActive
                  ? theme.colors.primaryBorder
                  : theme.colors.border,
              },
            ]}
          >
            <Avatar name={pet.name} source={pet.photoUrl} size="sm" />
            <Text
              style={[
                styles.petLabel,
                {
                  color: isActive
                    ? theme.colors.textPrimary
                    : theme.colors.textSecondary,
                },
              ]}
              numberOfLines={1}
            >
              {pet.name}
            </Text>
          </NorboPressable>
        );
      })}

      {/* Tail spacer so the last chip clears the screen edge. */}
      <View style={styles.tail} />
    </ScrollView>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    alignItems: "center",
  },
  allChip: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.pill,
    borderWidth: theme.hairline,
    height: 36,
    justifyContent: "center",
  },
  allLabel: {
    ...theme.typography.footnote,
    fontWeight: "600",
  },
  petChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    paddingRight: theme.spacing.md,
    paddingLeft: 4,
    paddingVertical: 4,
    borderRadius: theme.radius.pill,
    borderWidth: theme.hairline,
    maxWidth: 160,
  },
  petLabel: {
    ...theme.typography.footnote,
    fontWeight: "500",
  },
  tail: {
    width: theme.spacing.lg,
  },
}));

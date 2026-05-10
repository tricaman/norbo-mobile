import { NorboPressable } from "@/components/CustomPressable";
import React from "react";
import { Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

interface PetSuggestionChipsProps {
  suggestions: readonly string[];
  onSelect: (value: string) => void;
}

/**
 * PetSuggestionChips — horizontal row of pressable name suggestions
 * shown below the name input. Tapping fills the field. Wraps to a
 * second line on smaller screens.
 */
export function PetSuggestionChips({
  suggestions,
  onSelect,
}: PetSuggestionChipsProps) {
  return (
    <View style={styles.row}>
      {suggestions.map((s) => (
        <NorboPressable
          key={s}
          scale="row"
          haptic="light"
          onPress={() => onSelect(s)}
          style={styles.chip}
        >
          <Text style={styles.text}>{s}</Text>
        </NorboPressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
    justifyContent: "center",
  },
  chip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface,
    borderWidth: theme.hairline,
    borderColor: theme.colors.border,
  },
  text: {
    ...theme.typography.footnote,
    color: theme.colors.textSecondary,
  },
}));

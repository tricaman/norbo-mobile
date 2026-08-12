import { NorboPressable } from "@/components/CustomPressable";
import React from "react";
import { ScrollView, Text } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

/**
 * Generic tool-local species/group chip picker (options-driven variant of
 * SmallMammalSpeciesPicker). The caller owns the option list AND the labels —
 * this component does no i18n on its own. Not a design-system primitive.
 */
export function ToolSpeciesChips({
  options,
  value,
  onChange,
}: {
  options: readonly { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}): React.JSX.Element {
  const { theme } = useUnistyles();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.track}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <NorboPressable
            key={option.value}
            scale="text"
            haptic="light"
            onPress={() => onChange(option.value)}
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
              {option.label}
            </Text>
          </NorboPressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create((theme) => ({
  track: { gap: theme.spacing.sm, paddingVertical: theme.spacing.xs },
  chip: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface,
    borderWidth: theme.hairline,
    borderColor: theme.colors.border,
  },
  label: { ...theme.typography.footnote },
}));

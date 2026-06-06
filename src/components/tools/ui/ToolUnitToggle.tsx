import { NorboPressable } from "@/components/CustomPressable";
import React from "react";
import { Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

interface ToolUnitOption<T extends string> {
  value: T;
  label: string;
}

interface ToolUnitToggleProps<T extends string> {
  /** Unit options, e.g. [{ value: "kg", label: "kg" }, { value: "lb", label: "lb" }]. */
  options: readonly ToolUnitOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

/**
 * ToolUnitToggle — compact segmented control for picking a unit (kg/lb,
 * cm/in, …). Same selected-state treatment as `PetWizardChoiceRow` (primarySoft
 * fill + primary border) but small and inline. Labels use DM Mono, the app's
 * font for unit/code text.
 */
export function ToolUnitToggle<T extends string>({
  options,
  value,
  onChange,
}: ToolUnitToggleProps<T>): React.JSX.Element {
  const { theme } = useUnistyles();
  return (
    <View style={styles.track}>
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <NorboPressable
            key={opt.value}
            scale="text"
            haptic="light"
            onPress={() => onChange(opt.value)}
            style={[
              styles.segment,
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
              {opt.label}
            </Text>
          </NorboPressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  track: {
    flexDirection: "row",
    gap: theme.spacing.xs,
  },
  segment: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface,
    borderWidth: theme.hairline,
    borderColor: theme.colors.border,
  },
  label: {
    ...theme.monoTypography.captionMono,
  },
}));

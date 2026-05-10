import { NorboPressable } from "@/components/CustomPressable";
import React from "react";
import { Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

interface PetWizardChoice<TValue extends string> {
  value: TValue;
  label: string;
}

interface PetWizardChoiceRowProps<TValue extends string> {
  options: readonly PetWizardChoice<TValue>[];
  value: TValue | undefined;
  onChange: (value: TValue) => void;
  /** "row" (default) keeps options on one line; "stack" lays them vertically. */
  layout?: "row" | "stack";
}

/**
 * PetWizardChoiceRow — large segmented selector used by the binary /
 * ternary fields (sex, sterilized). Each option is a tall card so it
 * remains tappable on small devices and reads as the canonical wizard
 * "pick one" UI, distinct from the inline chip lists in FormCard.
 */
export function PetWizardChoiceRow<TValue extends string>({
  options,
  value,
  onChange,
  layout = "row",
}: PetWizardChoiceRowProps<TValue>) {
  const { theme } = useUnistyles();

  return (
    <View style={layout === "row" ? styles.row : styles.stack}>
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <NorboPressable
            key={opt.value}
            scale="card"
            haptic="light"
            onPress={() => onChange(opt.value)}
            style={[
              layout === "row" ? styles.choiceRow : styles.choiceStack,
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
                  fontWeight: selected ? "600" : "500",
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
  row: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  stack: {
    flexDirection: "column",
    gap: theme.spacing.sm,
  },
  choiceRow: {
    flex: 1,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: theme.hairline,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  choiceStack: {
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: theme.hairline,
    borderColor: theme.colors.border,
  },
  label: {
    ...theme.typography.subhead,
  },
}));

import { NorboPressable } from "@/components/CustomPressable";
import React from "react";
import { ScrollView, Text } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

export type ReminderFilter = "all" | "today" | "next7" | "overdue";

interface ReminderFilterChipsProps {
  value: ReminderFilter;
  onChange: (filter: ReminderFilter) => void;
  options: { value: ReminderFilter; label: string }[];
}

export function ReminderFilterChips({
  value,
  onChange,
  options,
}: ReminderFilterChipsProps) {
  const { theme } = useUnistyles();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <NorboPressable
            key={opt.value}
            scale="row"
            haptic="light"
            onPress={() => onChange(opt.value)}
            style={[
              styles.chip,
              isActive
                ? {
                    backgroundColor: theme.colors.primary,
                    borderColor: theme.colors.primary,
                  }
                : {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
            ]}
          >
            <Text
              style={[
                styles.label,
                {
                  color: isActive
                    ? theme.colors.textOnPrimary
                    : theme.colors.textPrimary,
                },
              ]}
            >
              {opt.label}
            </Text>
          </NorboPressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  chip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.pill,
    borderWidth: theme.hairline,
  },
  label: {
    ...theme.typography.subhead,
    fontWeight: "600",
  },
}));

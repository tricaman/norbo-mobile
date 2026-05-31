import { NorboPressable } from "@/components/CustomPressable";
import { IconSymbol } from "@/components/ui/IconSymbol";
import React from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

export type Period = "month" | "year" | "all";

interface PeriodChipsProps {
  value: Period;
  onChange: (period: Period) => void;
}

const ORDER: ReadonlyArray<{
  value: Period;
  i18nKey: "expenses.periodMonth" | "expenses.periodYear" | "expenses.periodAll";
  icon: string;
}> = [
  { value: "month", i18nKey: "expenses.periodMonth", icon: "calendar" },
  { value: "year", i18nKey: "expenses.periodYear", icon: "calendar" },
  { value: "all", i18nKey: "expenses.periodAll", icon: "arrow.triangle.2.circlepath" },
];

export function PeriodChips({
  value,
  onChange,
}: PeriodChipsProps): React.ReactElement {
  const { t } = useTranslation();
  const { theme } = useUnistyles();

  return (
    <View style={styles.row}>
      {ORDER.map((opt) => {
        const isActive = opt.value === value;
        return (
          <NorboPressable
            key={opt.value}
            scale="row"
            haptic="light"
            onPress={() => onChange(opt.value)}
            style={[
              styles.chip,
              {
                backgroundColor: isActive
                  ? theme.colors.surface
                  : "transparent",
                borderColor: isActive
                  ? theme.colors.border2
                  : theme.colors.border,
              },
            ]}
          >
            <IconSymbol
              name={opt.icon}
              size={13}
              tintColor={
                isActive ? theme.colors.textPrimary : theme.colors.textTertiary
              }
            />
            <Text
              style={[
                styles.label,
                {
                  color: isActive
                    ? theme.colors.textPrimary
                    : theme.colors.textTertiary,
                  fontWeight: isActive ? "600" : "500",
                },
              ]}
            >
              {t(opt.i18nKey)}
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
    paddingHorizontal: theme.spacing.lg,
  },
  chip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.pill,
    borderWidth: theme.hairline,
  },
  label: {
    ...theme.typography.footnote,
  },
}));

import React from "react";
import { Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

interface PageTitleProps {
  title: string;
  subtitle?: string;
  /** Optional right-side action (e.g. add button). */
  right?: React.ReactNode;
}

/**
 * PageTitle — unified title/subtitle header for tab screens.
 *
 * Standardizes the title1 + footnote pattern used across expenses,
 * reminders, and home greeting. Optional right slot for actions.
 */
export function PageTitle({ title, subtitle, right }: PageTitleProps) {
  const { theme } = useUnistyles();

  return (
    <View style={styles.container}>
      <View style={styles.text}>
        <Text
          style={[styles.title, { color: theme.colors.textPrimary }]}
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            style={[styles.subtitle, { color: theme.colors.textSecondary }]}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        )}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...theme.typography.title1,
    fontWeight: "700",
  },
  subtitle: {
    ...theme.typography.footnote,
  },
}));

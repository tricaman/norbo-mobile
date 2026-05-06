import React from "react";
import { Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

interface EmptyStateProps {
  title: string;
  subtitle: string;
}

export function EmptyState({ title, subtitle }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    alignItems: "center",
    paddingTop: theme.spacing["5xl"],
    paddingHorizontal: theme.spacing["3xl"],
    gap: theme.spacing.sm,
  },
  title: {
    ...theme.typography.subhead,
    color: theme.colors.textSecondary,
  },
  subtitle: {
    ...theme.typography.footnote,
    color: theme.colors.textTertiary,
    textAlign: "center",
  },
}));

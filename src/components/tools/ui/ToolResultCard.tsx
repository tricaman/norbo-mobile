import React from "react";
import { Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

interface ToolResultCardProps {
  /** Small uppercase label above the value (e.g. "human age"). */
  label?: string;
  /** The formatted result value (already a string). */
  value: string;
  /** Unit shown next to the value (e.g. "years", "L"). */
  unit?: string;
  /** Footnote under the value — e.g. an "indicative, not a vet" disclaimer. */
  caption?: string;
}

/**
 * ToolResultCard — surface card presenting a tool's computed result. The value
 * uses DM Mono (the app's font for numbers/figures); the card never persists
 * anything, it just displays what the tool computed from its inputs.
 */
export function ToolResultCard({
  label,
  value,
  unit,
  caption,
}: ToolResultCardProps): React.JSX.Element {
  return (
    <View style={styles.card}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.valueRow}>
        <Text style={styles.value}>{value}</Text>
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
      </View>
      {caption ? <Text style={styles.caption}>{caption}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.xs,
    ...theme.card,
  },
  label: {
    ...theme.typography.footnote,
    color: theme.colors.primary,
    textTransform: "lowercase",
    letterSpacing: 1,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: theme.spacing.sm,
  },
  value: {
    fontFamily: theme.fonts.monoMd,
    fontSize: 32,
    lineHeight: 38,
    color: theme.colors.textPrimary,
  },
  unit: {
    ...theme.typography.subhead,
    color: theme.colors.textSecondary,
  },
  caption: {
    ...theme.typography.footnote,
    color: theme.colors.textTertiary,
  },
}));

import { Divider } from "@/components/ui/Divider";
import { SectionLabel } from "@/components/ui/SectionLabel";
import React from "react";
import { View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

interface ToolSectionProps {
  /** Optional uppercase section label. */
  label?: string;
  children: React.ReactNode;
}

/**
 * ToolSection — a section separator for longer tool forms: a hairline rule,
 * an optional label, then the grouped fields. Composes the existing `Divider`
 * and `SectionLabel` primitives so spacing and styling stay consistent.
 */
export function ToolSection({
  label,
  children,
}: ToolSectionProps): React.JSX.Element {
  const { theme } = useUnistyles();
  return (
    <View style={styles.section}>
      <Divider marginBottom={theme.spacing.md} />
      {label ? <SectionLabel>{label}</SectionLabel> : null}
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  section: {
    marginTop: theme.spacing.lg,
  },
  body: {
    gap: theme.spacing.md,
  },
}));

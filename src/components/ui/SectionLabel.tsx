import React from "react";
import { StyleProp, Text, TextStyle } from "react-native";
import { StyleSheet } from "react-native-unistyles";

interface SectionLabelProps {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
}

/**
 * SectionLabel — uppercase primary-tinted footnote used above form cards and
 * grouped settings sections. Always use this instead of redefining the style.
 */
export function SectionLabel({ children, style }: SectionLabelProps) {
  return <Text style={[styles.label, style]}>{children}</Text>;
}

const styles = StyleSheet.create((theme) => ({
  label: {
    ...theme.typography.footnote,
    color: theme.colors.primary,
    textTransform: "lowercase",
    letterSpacing: 1,
    paddingHorizontal: theme.spacing.xs,
    paddingBottom: theme.spacing.xs,
  },
}));

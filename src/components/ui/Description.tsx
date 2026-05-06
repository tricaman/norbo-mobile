import React from "react";
import { StyleProp, Text, TextStyle } from "react-native";
import { StyleSheet } from "react-native-unistyles";

interface DescriptionProps {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
}

/**
 * Description — secondary helper text shown under forms and cards.
 * Footnote, textSecondary, relaxed line-height.
 */
export function Description({ children, style }: DescriptionProps) {
  return <Text style={[styles.desc, style]}>{children}</Text>;
}

const styles = StyleSheet.create((theme) => ({
  desc: {
    ...theme.typography.footnote,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    paddingHorizontal: theme.spacing.xs,
  },
}));

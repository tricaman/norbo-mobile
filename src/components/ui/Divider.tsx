import React from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

interface DividerProps {
  /** Left inset in px — used for avatar-indented dividers. */
  inset?: number;
  /** Vertical spacing below the divider. */
  marginBottom?: number;
}

/**
 * Divider — hairline horizontal rule using theme.hairline and theme.colors.border.
 * Use for card internal separators, list separators, and inline dividers.
 */
export function Divider({ inset, marginBottom }: DividerProps) {
  return (
    <View
      style={[
        styles.divider,
        inset ? { marginLeft: inset } : null,
        marginBottom !== undefined ? { marginBottom } : null,
      ]}
    />
  );
}

const styles = StyleSheet.create((theme) => ({
  divider: {
    height: theme.hairline,
    backgroundColor: theme.colors.border,
  },
}));

import React from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

/**
 * ListSeparator — FlatList `ItemSeparatorComponent` for rows containing an avatar.
 * Inset matches avatar.md (46) + row horizontal padding (md).
 */
export function ListSeparator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create((theme) => ({
  separator: {
    height: theme.hairline,
    backgroundColor: theme.colors.border,
    marginLeft: theme.avatarSize.lg + theme.spacing.md * 2,
  },
}));

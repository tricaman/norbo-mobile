import React from "react";
import { ActivityIndicator, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

/**
 * ToolLoading — Suspense fallback while a lazily-evaluated tool module mounts.
 * Mirrors `QueryBoundary`'s default loader (centered ActivityIndicator) for a
 * consistent loading look across the app.
 */
export function ToolLoading(): React.JSX.Element {
  const { theme } = useUnistyles();
  return (
    <View style={styles.center}>
      <ActivityIndicator color={theme.colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.xl,
  },
}));

import React from "react";
import { StyleProp, ViewStyle } from "react-native";
import {
  SafeAreaView,
  type Edge,
} from "react-native-safe-area-context";
import { StyleSheet } from "react-native-unistyles";

interface ScreenProps {
  children: React.ReactNode;
  edges?: ReadonlyArray<Edge>;
  style?: StyleProp<ViewStyle>;
}

/**
 * Screen — canonical top-level wrapper for every screen.
 * Applies themed background + SafeAreaView. Always use this instead of
 * re-declaring `{ flex: 1, backgroundColor: theme.colors.background }`.
 */
export function Screen({ children, edges, style }: ScreenProps) {
  return (
    <SafeAreaView style={[styles.safe, style]} edges={edges}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
}));

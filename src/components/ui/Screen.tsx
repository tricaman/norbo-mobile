import React from "react";
import { StyleProp, View, ViewStyle } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";
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
 *
 * The background color lives on a plain RN `View` — the unistyles Babel
 * plugin only attaches the native theme binding to host components it can
 * see. `SafeAreaView` comes from `react-native-safe-area-context`
 * (node_modules, not in `root: src`) so the plugin does not process it; a
 * background color set on it would never update at runtime. The inner
 * SafeAreaView stays transparent and only applies the safe-area insets.
 */
export function Screen({ children, edges, style }: ScreenProps) {
  return (
    <View style={styles.outer}>
      <SafeAreaView style={[styles.safe, style]} edges={edges}>
        {children}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  outer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  safe: {
    flex: 1,
  },
}));

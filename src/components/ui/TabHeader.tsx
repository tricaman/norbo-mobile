import { UpdateHeaderButton } from "@/components/app/UpdateHeaderButton";
import React from "react";
import { Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

interface TabHeaderProps {
  title: string;
  /** Optional trailing action slot (e.g. a button on the right). */
  right?: React.ReactNode;
}

/**
 * TabHeader — canonical large title for tab-root screens.
 * Uses title1 + letterSpacing 2 per the design system.
 *
 * The trailing slot always leads with `UpdateHeaderButton`, which renders
 * nothing unless an update is available — that's how the in-app update is
 * offered on every tab root without a popup (see `UpdateGate`).
 */
export function TabHeader({ title, right }: TabHeaderProps) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.actions}>
        <UpdateHeaderButton />
        {right}
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing["3xl"],
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  title: {
    ...theme.typography.title1,
    color: theme.colors.textPrimary,
    letterSpacing: 2,
  },
}));

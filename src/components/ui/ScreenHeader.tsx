import { GoBackButton } from "@/components/GoBackButton";
import React from "react";
import { Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

interface ScreenHeaderProps {
  title: string;
  /** Optional right-side action (e.g. SaveHeaderAction). */
  right?: React.ReactNode;
  /** If false, hides the back button. Defaults to true. */
  back?: boolean;
  /**
   * Layout variant.
   * - "modal" (default): title centered, right slot on the right, used for form/modal screens.
   * - "simple": left-aligned, used for profile detail-style screens.
   */
  variant?: "modal" | "simple";
}

const HEADER_BTN_SIZE = 40;

/**
 * ScreenHeader — canonical sub-screen/modal header.
 * Replaces the repeated header/headerBtn/headerTitle triplet across screens.
 */
export function ScreenHeader({
  title,
  right,
  back = true,
  variant = "modal",
}: ScreenHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.side}>
        {back ? (
          <GoBackButton style={styles.btn} />
        ) : (
          <View style={styles.btn} />
        )}
      </View>
      <Text
        style={[styles.title, variant === "simple" && styles.titleLeft]}
        numberOfLines={1}
      >
        {title}
      </Text>
      <View style={[styles.side, styles.sideRight]}>
        {right ?? <View style={styles.btn} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: theme.hairline,
    borderBottomColor: theme.colors.border,
  },
  side: {
    minWidth: HEADER_BTN_SIZE,
    alignItems: "flex-start",
  },
  sideRight: {
    alignItems: "flex-end",
  },
  btn: {
    width: HEADER_BTN_SIZE,
    height: HEADER_BTN_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    ...theme.typography.subhead,
    color: theme.colors.textPrimary,
    flex: 1,
    textAlign: "center",
    textTransform: "lowercase",
  },
  titleLeft: {
    textAlign: "left",
    marginLeft: theme.spacing.sm,
  },
}));

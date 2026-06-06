import { Divider } from "@/components/ui/Divider";
import React from "react";
import { StyleProp, Text, View, ViewStyle } from "react-native";
import { StyleSheet } from "react-native-unistyles";

interface FormCardProps {
  /** Uppercase label rendered at the top of the card. Optional. */
  label?: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** When true, inserts a Divider between each child. Defaults to false. */
  dividedChildren?: boolean;
}

/**
 * FormCard — surface card used on every form screen (username/name/bio/add-contact).
 * Handles the card background, border, label, and internal divider.
 */
export function FormCard({
  label,
  children,
  style,
  dividedChildren = false,
}: FormCardProps) {
  const items = React.Children.toArray(children);

  return (
    <View style={[styles.card, style]}>
      {label ? (
        <>
          <Text style={styles.label}>{label}</Text>
          <Divider marginBottom={8} />
        </>
      ) : null}
      {dividedChildren
        ? items.map((child, i) => (
            <React.Fragment key={i}>
              {child}
              {i < items.length - 1 ? <Divider marginBottom={8} /> : null}
            </React.Fragment>
          ))
        : children}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    ...theme.card,
  },
  label: {
    ...theme.typography.footnote,
    color: theme.colors.primary,
    textTransform: "lowercase",
    letterSpacing: 0.8,
    paddingBottom: theme.spacing.sm,
  },
}));

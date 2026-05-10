import React from "react";
import { Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

interface PetStepHeadingProps {
  title: string;
  subtitle?: string;
  align?: "left" | "center";
}

/**
 * PetStepHeading — the big question + helper line that opens every
 * wizard step ("Come si chiama?" / "Iniziamo dal nome..."). Centralised
 * so spacing and typography stay identical across steps.
 */
export function PetStepHeading({
  title,
  subtitle,
  align = "left",
}: PetStepHeadingProps) {
  return (
    <View
      style={[
        styles.wrap,
        align === "center" && { alignItems: "center" },
      ]}
    >
      <Text
        style={[styles.title, align === "center" && { textAlign: "center" }]}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text
          style={[
            styles.subtitle,
            align === "center" && { textAlign: "center" },
          ]}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  wrap: {
    gap: theme.spacing.xs,
  },
  title: {
    ...theme.typography.title1,
    color: theme.colors.textPrimary,
  },
  subtitle: {
    ...theme.typography.footnote,
    color: theme.colors.textSecondary,
  },
}));

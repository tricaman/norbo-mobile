import { NorboPressable } from "@/components/CustomPressable";
import { IconSymbol } from "@/components/ui/IconSymbol";
import React from "react";
import { Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { TOTAL_FORM_STEPS } from "./wizard.types";

const TOTAL_DOTS = TOTAL_FORM_STEPS;
const BTN_SIZE = 36;

interface PetWizardHeaderProps {
  /** 0 = no dots (category step), 1..TOTAL_DOTS = current step. */
  step: number;
  /** "close" → X icon (used on the first step). "back" → chevron-left. */
  leading?: "close" | "back" | "none";
  onLeadingPress?: () => void;
  /** When true, shows the "skip" button on the right. */
  canSkip?: boolean;
  onSkip?: () => void;
  skipLabel?: string;
}

/**
 * PetWizardHeader — minimalist top bar for the pet creation flow.
 *
 * Layout: [leading button] · · · · · [optional skip]
 *
 * Step 0 hides the dots and shows only the leading X (category screen
 * acts as the entry point). Steps 1..N render `TOTAL_DOTS` indicator
 * dots, the active one filled with `colors.primary`.
 */
export function PetWizardHeader({
  step,
  leading = "back",
  onLeadingPress,
  canSkip = false,
  onSkip,
  skipLabel,
}: PetWizardHeaderProps) {
  const { theme } = useUnistyles();

  return (
    <View style={styles.container}>
      <View style={styles.side}>
        {leading !== "none" && onLeadingPress ? (
          <NorboPressable
            style={styles.iconBtn}
            scale="row"
            haptic="light"
            onPress={onLeadingPress}
          >
            <IconSymbol
              name={leading === "close" ? "xmark.circle.fill" : "chevron.left"}
              size={leading === "close" ? 28 : 22}
              tintColor={
                leading === "close"
                  ? theme.colors.textTertiary
                  : theme.colors.textPrimary
              }
            />
          </NorboPressable>
        ) : (
          <View style={styles.iconBtn} />
        )}
      </View>

      {step > 0 ? (
        <View style={styles.dots}>
          {Array.from({ length: TOTAL_DOTS }).map((_, i) => {
            const filled = i + 1 <= step;
            return (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    width: filled ? 22 : 8,
                    backgroundColor: filled
                      ? theme.colors.primary
                      : theme.colors.border2,
                  },
                ]}
              />
            );
          })}
        </View>
      ) : (
        <View style={styles.dots} />
      )}

      <View style={[styles.side, styles.sideRight]}>
        {canSkip && onSkip ? (
          <NorboPressable
            style={styles.skipBtn}
            scale="row"
            haptic="light"
            onPress={onSkip}
          >
            <Text style={styles.skipText}>{skipLabel}</Text>
          </NorboPressable>
        ) : (
          <View style={styles.iconBtn} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.sm,
  },
  side: {
    minWidth: BTN_SIZE,
    alignItems: "flex-start",
  },
  sideRight: {
    alignItems: "flex-end",
  },
  iconBtn: {
    width: BTN_SIZE,
    height: BTN_SIZE,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BTN_SIZE / 2,
    backgroundColor: theme.colors.surface,
  },
  dots: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  skipBtn: {
    height: BTN_SIZE,
    paddingHorizontal: theme.spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  skipText: {
    ...theme.typography.subhead,
    color: theme.colors.textSecondary,
  },
}));

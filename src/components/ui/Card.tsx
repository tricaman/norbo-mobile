import { NorboPressable } from "@/components/CustomPressable";
import type { HapticWeight } from "@/utils/haptics";
import React from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { pressScale } from "@/theme/tokens";

type ScalePreset = keyof typeof pressScale;

interface CardProps {
  children: React.ReactNode;
  /** When provided, the card is pressable (wrapped in `NorboPressable`). */
  onPress?: () => void;
  /** Press-scale preset, forwarded to `NorboPressable`. Defaults to "card". */
  scale?: ScalePreset;
  /** Haptic weight, forwarded to `NorboPressable`. Defaults to "light". */
  haptic?: HapticWeight;
  /**
   * Clip children to the rounded corners (`overflow: "hidden"`). Needed for
   * cards that render media or internal dividers edge-to-edge. Off by default
   * because clipping also clips the drop shadow on iOS.
   */
  clip?: boolean;
  /** Pass-throughs to `NorboPressable` for the premium press affordance. */
  premium?: boolean;
  deep?: boolean;
  /** Outer layout style (width, margins, internal padding…). */
  style?: StyleProp<ViewStyle>;
}

/**
 * Card — the single parent for every card surface in the app.
 *
 * It owns ONLY the shared "chrome": surface colour + the centralized `card`
 * token (radius, shadow, border). It deliberately does NOT impose padding,
 * dividers, or internal layout — those stay in each consumer. Change the look
 * of every card at once by editing this file or the `card` token in
 * `theme/tokens.ts`.
 */
export function Card({
  children,
  onPress,
  scale = "card",
  haptic = "light",
  clip = false,
  premium,
  deep,
  style,
}: CardProps) {
  const composed: StyleProp<ViewStyle> = [
    styles.card,
    clip && styles.clip,
    style,
  ];

  if (onPress) {
    return (
      <NorboPressable
        onPress={onPress}
        scale={scale}
        haptic={haptic}
        premium={premium}
        deep={deep}
        style={composed}
      >
        {children}
      </NorboPressable>
    );
  }

  return <View style={composed}>{children}</View>;
}

const styles = StyleSheet.create((theme) => ({
  card: {
    backgroundColor: theme.colors.surface,
    ...theme.card,
  },
  clip: {
    overflow: "hidden",
  },
}));

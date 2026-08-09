import React from "react";
import { View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

interface ProgressBarProps {
  /** 0..1. Values outside the range are clamped, never trusted. */
  value: number;
  /** Fill colour — usually the rarity's foreground. */
  color: string;
  trackColor?: string;
  height?: number;
}

/**
 * A flat progress track. Lives in `ui/` rather than `badges/` because it shows
 * up in both the grid tile and the detail sheet.
 *
 * The clamp here is the second of two: the server already clamps in
 * `domain/ladder.ts`. Both exist because a bar that renders backwards or spills
 * past its track is the kind of bug that only shows up in front of a user.
 */
export function ProgressBar({
  value,
  color,
  trackColor,
  height = 4,
}: ProgressBarProps) {
  const { theme } = useUnistyles();
  const safe = Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;

  return (
    <View
      style={[
        styles.track,
        {
          height,
          backgroundColor: trackColor ?? theme.colors.surface2,
        },
      ]}
    >
      <View
        style={[
          styles.fill,
          { width: `${safe * 100}%`, backgroundColor: color },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  track: {
    width: "100%",
    borderRadius: theme.radius.pill,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: theme.radius.pill,
  },
}));

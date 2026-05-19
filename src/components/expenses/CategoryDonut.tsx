import React, { useMemo } from "react";
import { Text, View } from "react-native";
import Svg, { Circle, G } from "react-native-svg";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

interface CategoryDonutSlice {
  key: string;
  value: number;
  color: string;
}

interface CategoryDonutProps {
  slices: CategoryDonutSlice[];
  total: number;
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
}

/**
 * CategoryDonut — minimalist SVG donut chart.
 *
 * Pure rendering: callers compute colors and totals; this component just
 * draws stroked-arc circles using `strokeDasharray` and `strokeDashoffset`
 * to create slices. No animation — keeps it dependency-light and aligned
 * with the design system's "calm" feel.
 */
export function CategoryDonut({
  slices,
  total,
  size = 140,
  thickness = 16,
  centerLabel,
  centerValue,
}: CategoryDonutProps): React.ReactElement {
  const { theme } = useUnistyles();
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  const segments = useMemo(() => {
    if (total <= 0) return [];
    let offset = 0;
    return slices.map((s) => {
      const fraction = s.value / total;
      const length = fraction * circumference;
      const seg = {
        key: s.key,
        color: s.color,
        dasharray: `${length} ${circumference - length}`,
        dashoffset: -offset,
      };
      offset += length;
      return seg;
    });
  }, [slices, total, circumference]);

  return (
    <View style={[styles.root, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.colors.surface2}
          strokeWidth={thickness}
          fill="none"
        />
        {/* Slices: rotate -90deg so they start at 12 o'clock */}
        <G rotation={-90} originX={size / 2} originY={size / 2}>
          {segments.map((seg) => (
            <Circle
              key={seg.key}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={seg.color}
              strokeWidth={thickness}
              strokeDasharray={seg.dasharray}
              strokeDashoffset={seg.dashoffset}
              strokeLinecap="butt"
              fill="none"
            />
          ))}
        </G>
      </Svg>

      {(centerLabel || centerValue) && (
        <View pointerEvents="none" style={styles.center}>
          {centerLabel && (
            <Text
              style={[styles.centerLabel, { color: theme.colors.textTertiary }]}
            >
              {centerLabel}
            </Text>
          )}
          {centerValue && (
            <Text
              style={[styles.centerValue, { color: theme.colors.textPrimary }]}
              numberOfLines={1}
            >
              {centerValue}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: {
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  centerLabel: {
    ...theme.typography.caption,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  centerValue: {
    ...theme.typography.title2,
    fontWeight: "700",
  },
}));

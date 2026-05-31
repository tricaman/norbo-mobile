import {
  Canvas,
  Circle,
  Group,
  Line,
  LinearGradient,
  Path,
  Skia,
  Text as SkiaText,
  matchFont,
  vec,
} from "@shopify/react-native-skia";
import React, { useMemo, useState } from "react";
import { Platform, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

export interface LineChartPoint {
  /** Value on the Y-axis. */
  value: number;
  /** Label displayed on the X-axis (e.g. "31/5", "gen", "Mar"). */
  xLabel: string;
}

interface LineChartProps {
  points: LineChartPoint[];
  height?: number;
  /**
   * Format a Y-axis tick value for display.
   * Defaults to rounding or showing one decimal for small values.
   */
  formatYLabel?: (value: number) => string;
  /**
   * When true the Y-axis starts at 0 instead of auto-scaling from the
   * minimum value. Useful for absolute quantities (expenses, counts).
   * Default: false (auto-scale with 10% padding).
   */
  zeroBaseline?: boolean;
}

const PADDING_LEFT = 50;
const PADDING_RIGHT = 16;
const PADDING_TOP = 20;
const PADDING_BOTTOM = 32;
const DOT_RADIUS = 4;
const MAX_Y_TICKS = 5;

const chartFont = matchFont({
  fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
  fontSize: 10,
  fontWeight: "normal",
  fontStyle: "normal",
});

function defaultFormatYLabel(value: number): string {
  if (value >= 1000) return `${Math.round(value / 1000)}k`;
  if (value < 10 && value !== Math.round(value)) return value.toFixed(1);
  return Math.round(value).toString();
}

export function LineChart({
  points,
  height = 200,
  formatYLabel = defaultFormatYLabel,
  zeroBaseline = false,
}: LineChartProps): React.ReactElement | null {
  const { theme } = useUnistyles();
  const [containerWidth, setContainerWidth] = useState(0);

  const chartData = useMemo(() => {
    if (points.length === 0) return null;

    const values = points.map((p) => p.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);

    let yMin: number;
    let yMax: number;

    if (zeroBaseline) {
      yMin = 0;
      yMax = maxVal === 0 ? 100 : niceMax(maxVal);
    } else {
      const range = maxVal - minVal || 1;
      yMin = minVal - range * 0.1;
      yMax = maxVal + range * 0.1;
    }

    return { yMin, yMax };
  }, [points, zeroBaseline]);

  if (!chartData || containerWidth === 0) {
    return (
      <View
        style={[
          styles.container,
          {
            height,
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
        onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
      />
    );
  }

  const { yMin, yMax } = chartData;
  const chartWidth = containerWidth;
  const chartHeight = height;

  const drawWidth = chartWidth - PADDING_LEFT - PADDING_RIGHT;
  const drawHeight = chartHeight - PADDING_TOP - PADDING_BOTTOM;

  const toX = (i: number) =>
    PADDING_LEFT +
    (points.length > 1
      ? (i / (points.length - 1)) * drawWidth
      : drawWidth / 2);

  const toY = (val: number) =>
    PADDING_TOP + drawHeight - ((val - yMin) / (yMax - yMin)) * drawHeight;

  // Line path
  const linePath = Skia.Path.Make();
  points.forEach((p, i) => {
    const x = toX(i);
    const y = toY(p.value);
    if (i === 0) linePath.moveTo(x, y);
    else linePath.lineTo(x, y);
  });

  // Area fill path
  const areaPath = Skia.Path.Make();
  points.forEach((p, i) => {
    const x = toX(i);
    const y = toY(p.value);
    if (i === 0) areaPath.moveTo(x, y);
    else areaPath.lineTo(x, y);
  });
  areaPath.lineTo(toX(points.length - 1), PADDING_TOP + drawHeight);
  areaPath.lineTo(toX(0), PADDING_TOP + drawHeight);
  areaPath.close();

  // Y-axis ticks
  const yRange = yMax - yMin;
  const yStep = yRange / (MAX_Y_TICKS - 1);
  const yTicks = Array.from(
    { length: MAX_Y_TICKS },
    (_, i) => yMin + i * yStep,
  );

  // X-axis labels: show first, middle, last — or every Nth when many points
  const xLabels = pickXLabels(points);

  return (
    <View
      style={[
        styles.container,
        {
          height: chartHeight,
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      <Canvas style={{ width: chartWidth, height: chartHeight }}>
        {/* Grid lines */}
        {yTicks.map((tick, i) => (
          <Line
            key={`grid-${i}`}
            p1={vec(PADDING_LEFT, toY(tick))}
            p2={vec(chartWidth - PADDING_RIGHT, toY(tick))}
            color={theme.colors.border}
            strokeWidth={0.5}
          />
        ))}

        {/* Y labels */}
        {yTicks.map((tick, i) => (
          <SkiaText
            key={`yl-${i}`}
            x={4}
            y={toY(tick) + 4}
            text={formatYLabel(tick)}
            font={chartFont}
            color={theme.colors.textTertiary}
          />
        ))}

        {/* X labels */}
        {xLabels.map((xl) => (
          <SkiaText
            key={`xl-${xl.index}`}
            x={toX(xl.index) - 14}
            y={chartHeight - 6}
            text={xl.label}
            font={chartFont}
            color={theme.colors.textTertiary}
          />
        ))}

        {/* Area fill */}
        <Group>
          <Path path={areaPath} style="fill">
            <LinearGradient
              start={vec(0, PADDING_TOP)}
              end={vec(0, PADDING_TOP + drawHeight)}
              colors={[
                `${theme.colors.primary}30`,
                `${theme.colors.primary}05`,
              ]}
            />
          </Path>
        </Group>

        {/* Line */}
        <Path
          path={linePath}
          style="stroke"
          strokeWidth={2.5}
          color={theme.colors.primary}
          strokeCap="round"
          strokeJoin="round"
        />

        {/* Dots */}
        {points.map((p, i) => (
          <Circle
            key={`d-${i}`}
            cx={toX(i)}
            cy={toY(p.value)}
            r={DOT_RADIUS}
            color={theme.colors.primary}
          />
        ))}
      </Canvas>
    </View>
  );
}

/** Select a handful of evenly-spaced X labels so they don't overlap. */
function pickXLabels(
  points: LineChartPoint[],
): { index: number; label: string }[] {
  if (points.length === 0) return [];
  if (points.length === 1) return [{ index: 0, label: points[0].xLabel }];
  if (points.length === 2) {
    return [
      { index: 0, label: points[0].xLabel },
      { index: points.length - 1, label: points[points.length - 1].xLabel },
    ];
  }

  // For many points, space labels evenly (max ~6 labels)
  const maxLabels = Math.min(6, points.length);
  const step = (points.length - 1) / (maxLabels - 1);
  const labels: { index: number; label: string }[] = [];
  for (let i = 0; i < maxLabels; i++) {
    const idx = Math.round(i * step);
    labels.push({ index: idx, label: points[idx].xLabel });
  }
  return labels;
}

/** Round up to a "nice" max value for the Y-axis. */
function niceMax(value: number): number {
  if (value <= 0) return 100;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const normalized = value / magnitude;
  const nice =
    normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return nice * magnitude;
}

const styles = StyleSheet.create((theme) => ({
  container: {
    marginHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    borderWidth: theme.hairline,
    overflow: "hidden",
  },
}));

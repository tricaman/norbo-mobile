import React, { useEffect } from "react";
import { useWindowDimensions } from "react-native";
import { Canvas, Rect, LinearGradient, vec } from "@shopify/react-native-skia";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useUnistyles } from "react-native-unistyles";

interface DitGlowProps {
  glowHeight?: number;
  intensity?: number;
  pulse?: boolean;
}

export function DitGlow({
  glowHeight = 200,
  intensity = 1,
  pulse = false,
}: DitGlowProps) {
  const { width } = useWindowDimensions();
  const { theme } = useUnistyles();
  const glowOpacity = useSharedValue(intensity);

  useEffect(() => {
    if (pulse) {
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(intensity * 1.4, { duration: 1600 }),
          withTiming(intensity * 0.7, { duration: 1600 }),
        ),
        -1,
        false,
      );
    } else {
      glowOpacity.value = withTiming(intensity, { duration: 600 });
    }
  }, [pulse, intensity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const primary = theme.colors.primary;

  const toSkiaColor = (hex: string, alpha: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  };

  const canvasWidth = width;
  const canvasHeight = glowHeight;

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: glowHeight,
          pointerEvents: "none",
        },
        animatedStyle,
      ]}
    >
      <Canvas
        style={{
          width: canvasWidth,
          height: canvasHeight,
        }}
      >
        {/* Layer 1: base gradient from top to bottom */}
        <Rect x={0} y={0} width={canvasWidth} height={canvasHeight}>
          <LinearGradient
            start={vec(0, 0)}
            end={vec(0, canvasHeight)}
            colors={[
              toSkiaColor(primary, 0.0),
              toSkiaColor(primary, 0.08),
              toSkiaColor(primary, 0.18),
              toSkiaColor(primary, 0.25),
            ]}
            positions={[0, 0.3, 0.7, 1]}
          />
        </Rect>

        {/* Layer 2: intensified bottom gradient */}
        <Rect
          x={0}
          y={canvasHeight * 0.4}
          width={canvasWidth}
          height={canvasHeight * 0.6}
        >
          <LinearGradient
            start={vec(0, canvasHeight * 0.4)}
            end={vec(0, canvasHeight)}
            colors={[
              toSkiaColor(primary, 0.0),
              toSkiaColor(primary, 0.15),
              toSkiaColor(primary, 0.3),
            ]}
            positions={[0, 0.5, 1]}
          />
        </Rect>
      </Canvas>
    </Animated.View>
  );
}

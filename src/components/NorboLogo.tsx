import { springs } from "@/hooks/useSpring";
import React, { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { useUnistyles } from "react-native-unistyles";

interface Props {
  /**
   * Diameter of the central disc in pixels.
   * The component renders inside a SQUARE bounding box of side ~3.1x `size`,
   * with the disc at the geometric center; the arcs extend off-center toward
   * the right to mirror the real logo.
   */
  size?: number;
}

// Geometry, expressed in disc-radius units (R = size / 2).
// Tuned to match the brand icon (assets/images/icon.png): a solid disc with
// two partial radio-wave arcs to its right, both fully opaque and rendered
// with rounded caps.
const ARC1_STROKE = 0.45; // inner arc stroke width
const ARC1_RADIUS = 1.85; // inner arc mid-radius
const ARC1_HALF_ANGLE_DEG = 90; // half angular span (arc spans 2 * this) → full 180°

const ARC2_STROKE = 0.5; // outer arc stroke width
const ARC2_RADIUS = 2.85; // outer arc mid-radius
const ARC2_HALF_ANGLE_DEG = 90; // half angular span → full 180°

export function NorboLogo({ size = 40 }: Props) {
  const { theme } = useUnistyles();

  const discScale = useSharedValue(0);
  const discOpacity = useSharedValue(0);
  const arc1Scale = useSharedValue(0);
  const arc1Opacity = useSharedValue(0);
  const arc2Scale = useSharedValue(0);
  const arc2Opacity = useSharedValue(0);

  useEffect(() => {
    // 1. Central disc grows from a point with a playful bounce.
    discScale.value = withDelay(200, withSpring(1, springs.bouncy));
    discOpacity.value = withDelay(200, withSpring(1, springs.default));

    // 2./3. Arcs emanate outward like radio waves: scale grows from 0 to 1
    //       with a soft spring (no overshoot), then opacity pulses forever to
    //       evoke a continuously broadcasting signal.
    const PULSE_PERIOD = 1800; // ms for a full dim/bright cycle
    const PULSE_LOW = 0.45;
    const easing = Easing.inOut(Easing.quad);
    const buildPulse = () =>
      withRepeat(
        withSequence(
          withTiming(PULSE_LOW, { duration: PULSE_PERIOD / 2, easing }),
          withTiming(1, { duration: PULSE_PERIOD / 2, easing }),
        ),
        -1,
      );

    arc1Scale.value = withDelay(480, withSpring(1, springs.default));
    arc1Opacity.value = withDelay(
      480,
      withSequence(withTiming(1, { duration: 220, easing }), buildPulse()),
    );

    arc2Scale.value = withDelay(680, withSpring(1, springs.default));
    arc2Opacity.value = withDelay(
      680,
      withSequence(withTiming(1, { duration: 220, easing }), buildPulse()),
    );
  }, [discScale, discOpacity, arc1Scale, arc1Opacity, arc2Scale, arc2Opacity]);

  const discStyle = useAnimatedStyle(() => ({
    transform: [{ scale: discScale.value }],
    opacity: discOpacity.value,
  }));
  const arc1Style = useAnimatedStyle(() => ({
    transform: [{ scale: arc1Scale.value }],
    opacity: arc1Opacity.value,
  }));
  const arc2Style = useAnimatedStyle(() => ({
    transform: [{ scale: arc2Scale.value }],
    opacity: arc2Opacity.value,
  }));

  const R = size / 2;

  // Arc dimensions in pixels.
  const arc1Stroke = ARC1_STROKE * R;
  const arc1Radius = ARC1_RADIUS * R;
  const arc2Stroke = ARC2_STROKE * R;
  const arc2Radius = ARC2_RADIUS * R;

  // Outermost extent (arc 2 outer edge) drives the bounding boxes.
  const arc2Outer = arc2Radius + arc2Stroke / 2;

  // The container is a SQUARE centered on the disc center, so any parent
  // layout (alignItems: center) centers the disc itself — the arcs just
  // extend off-center toward the right, matching the real logo.
  const containerWidth = 2 * arc2Outer;
  const containerHeight = 2 * arc2Outer;
  const cx = containerWidth / 2; // disc center x = container center
  const cy = containerHeight / 2; // disc center y = container center

  // Each arc lives in its own SQUARE animated wrapper centered on the disc
  // center, so a transform: scale grows the arc outward from that point.
  // A 1px padding prevents the stroke (which would otherwise sit flush with
  // the SVG top/bottom edges) from being clipped by subpixel rounding.
  const ARC_PADDING = 1;
  const renderArc = (radius: number, stroke: number, halfAngleDeg: number) => {
    const half = radius + stroke / 2 + ARC_PADDING; // half-side of the wrapper square
    const center = half; // arc center within the SVG
    const halfAngleRad = (halfAngleDeg * Math.PI) / 180;
    const dx = radius * Math.cos(halfAngleRad);
    const dy = radius * Math.sin(halfAngleRad);
    const startX = center + dx;
    const startY = center - dy;
    const endX = center + dx;
    const endY = center + dy;
    const largeArc = halfAngleDeg > 90 ? 1 : 0;
    return {
      wrapperSize: 2 * half,
      wrapperLeft: cx - half,
      wrapperTop: cy - half,
      // Right-side arc spanning 2 * halfAngleDeg, centered on the horizontal
      // axis pointing right from the disc center.
      d: `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY}`,
    };
  };

  const arc1 = renderArc(arc1Radius, arc1Stroke, ARC1_HALF_ANGLE_DEG);
  const arc2 = renderArc(arc2Radius, arc2Stroke, ARC2_HALF_ANGLE_DEG);

  return (
    <View
      style={{
        width: containerWidth,
        height: containerHeight,
      }}
    >
      {/* Outer arc (rendered first so it sits behind) */}
      <Animated.View
        style={[
          {
            position: "absolute",
            left: arc2.wrapperLeft,
            top: arc2.wrapperTop,
            width: arc2.wrapperSize,
            height: arc2.wrapperSize,
          },
          arc2Style,
        ]}
      >
        <Svg width={arc2.wrapperSize} height={arc2.wrapperSize}>
          <Path
            d={arc2.d}
            stroke={theme.colors.primary}
            strokeWidth={arc2Stroke}
            strokeLinecap="round"
            fill="none"
          />
        </Svg>
      </Animated.View>

      {/* Inner arc */}
      <Animated.View
        style={[
          {
            position: "absolute",
            left: arc1.wrapperLeft,
            top: arc1.wrapperTop,
            width: arc1.wrapperSize,
            height: arc1.wrapperSize,
          },
          arc1Style,
        ]}
      >
        <Svg width={arc1.wrapperSize} height={arc1.wrapperSize}>
          <Path
            d={arc1.d}
            stroke={theme.colors.primary}
            strokeWidth={arc1Stroke}
            strokeLinecap="round"
            fill="none"
          />
        </Svg>
      </Animated.View>

      {/* Central disc (top-most) */}
      <Animated.View
        style={[
          {
            position: "absolute",
            left: cx - R,
            top: cy - R,
            width: size,
            height: size,
            borderRadius: R,
            backgroundColor: theme.colors.primary,
          },
          discStyle,
        ]}
      />
    </View>
  );
}

// Outer arc dimensions (stroke 0.5R, mid-radius 2.85R) push its outer edge to
// 3.1R from the disc center. The component bounding box is therefore a SQUARE
// of side 6.2R = 3.1 * size, centered on the disc — the arcs occupy only the
// right half of that square, leaving an empty band on the left.

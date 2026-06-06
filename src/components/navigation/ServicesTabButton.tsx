import { LOGO_PATH } from "@/components/ui/Logo";
import { springs } from "@/hooks/useSpring";
import { haptics } from "@/utils/haptics";
import React, { useEffect } from "react";
import { View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  interpolateColor,
  runOnJS,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface ServicesTabButtonProps {
  isActive: boolean;
  onPress: () => void;
  onLongPress: () => void;
}

export const CIRCLE_SIZE = 58;
const LOGO_SIZE = 40;
export const LIFT = 18;

/**
 * ServicesTabButton — the elevated, centered tab in the FloatingTabBar.
 *
 * Unlike a regular TabBarItem it floats above the bar (in evidenza) inside a
 * circular pill with a fixed surface2 background (matching the other tabs).
 * The logo cross-fades from primary (inactive) to textOnPrimary (active).
 * A shared spring drives the soft press/select scale so it matches the bounce
 * of the normal items.
 */
export function ServicesTabButton({
  isActive,
  onPress,
  onLongPress,
}: ServicesTabButtonProps) {
  const { theme } = useUnistyles();

  const scale = useSharedValue(1);
  const progress = useSharedValue(isActive ? 1 : 0);

  const bgInactive = theme.colors.background;
  const bgActive = theme.colors.primary;

  const triggerPress = () => {
    haptics.light();
    onPress();
  };

  const triggerLongPress = () => {
    haptics.medium();
    onLongPress();
  };

  useEffect(() => {
    progress.value = withSpring(isActive ? 1 : 0, springs.default);
    if (isActive) {
      scale.value = withSequence(
        withSpring(1.12, springs.bouncy),
        withSpring(1, springs.bouncy),
      );
    }
  }, [isActive]);

  const tap = Gesture.Tap()
    .onBegin(() => {
      scale.value = withSpring(0.9, springs.snappy);
    })
    .onFinalize((_, success) => {
      scale.value = withSpring(1, springs.bouncy);
      if (success) runOnJS(triggerPress)();
    });

  const longPress = Gesture.LongPress()
    .minDuration(500)
    .onStart(() => {
      runOnJS(triggerLongPress)();
    });

  const composed = Gesture.Race(longPress, tap);

  const circleStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [bgInactive, bgActive],
    ),
    transform: [{ translateY: -LIFT }, { scale: scale.value }],
  }));

  const outlineProps = useAnimatedProps(() => ({
    strokeOpacity: 1 - progress.value,
  }));

  const fillProps = useAnimatedProps(() => ({
    fillOpacity: progress.value,
  }));

  return (
    <GestureDetector gesture={composed}>
      <View style={styles.slot}>
        <Animated.View style={[styles.circle, circleStyle]}>
          <Svg width={LOGO_SIZE} height={LOGO_SIZE} viewBox="90 90 220 220">
            <AnimatedPath
              d={LOGO_PATH}
              fill="none"
              stroke={theme.colors.textTertiary}
              strokeWidth={8}
              strokeLinejoin="round"
              animatedProps={outlineProps}
            />
            <AnimatedPath
              d={LOGO_PATH}
              fill={theme.colors.textOnPrimary}
              fillRule="evenodd"
              animatedProps={fillProps}
            />
          </Svg>
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create((theme) => ({
  slot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
}));

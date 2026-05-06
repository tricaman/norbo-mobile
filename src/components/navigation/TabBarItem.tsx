import { springs } from "@/hooks/useSpring";
import { haptics } from "@/utils/haptics";
import React, { useEffect } from "react";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { TabIcon } from "./TabIcon";

interface TabBarItemProps {
  routeName: string;
  label: string;
  isActive: boolean;
  onPress: () => void;
  onLongPress: () => void;
}

export function TabBarItem({
  routeName,
  label,
  isActive,
  onPress,
  onLongPress,
}: TabBarItemProps) {
  const { theme } = useUnistyles();
  const scale = useSharedValue(1);
  const dotScale = useSharedValue(isActive ? 1 : 0);
  const labelOpacity = useSharedValue(isActive ? 1 : 0);

  useEffect(() => {
    dotScale.value = withSpring(isActive ? 1 : 0, springs.bouncy);
    labelOpacity.value = withSpring(isActive ? 1 : 0, springs.snappy);
  }, [isActive]);

  const triggerPress = () => {
    haptics.light();
    onPress();
  };

  const triggerLongPress = () => {
    haptics.medium();
    onLongPress();
  };

  const gesture = Gesture.Tap()
    .onBegin(() => {
      scale.value = withSpring(0.88, springs.snappy);
    })
    .onFinalize((_, success) => {
      scale.value = withSpring(1, springs.bouncy);
      if (success) runOnJS(triggerPress)();
    });

  const longPressGesture = Gesture.LongPress()
    .minDuration(500)
    .onStart(() => {
      runOnJS(triggerLongPress)();
    });

  const composed = Gesture.Race(longPressGesture, gesture);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(isActive ? 1.15 : 1, springs.default) }],
  }));

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale.value }],
    opacity: dotScale.value,
  }));

  const labelAnimStyle = useAnimatedStyle(() => ({
    opacity: labelOpacity.value,
    transform: [{ translateY: withSpring(isActive ? 0 : 4, springs.snappy) }],
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[styles.item, containerStyle]}>
        <Animated.View style={iconStyle}>
          <TabIcon
            routeName={routeName}
            isActive={isActive}
            activeColor={theme.colors.primary}
            inactiveColor={theme.colors.textTertiary}
          />
        </Animated.View>

        <Animated.View style={[styles.dot, dotStyle]} />

        <Animated.Text style={[styles.labelText, labelAnimStyle]}>
          {label.toLowerCase()}
        </Animated.Text>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create((theme) => ({
  item: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.xl,
    minWidth: 60,
    gap: 3,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.primary,
  },
  labelText: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
    textTransform: "lowercase",
    textAlign: "center",
  },
}));

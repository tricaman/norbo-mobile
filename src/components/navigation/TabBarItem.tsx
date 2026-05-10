import { springs } from "@/hooks/useSpring";
import { haptics } from "@/utils/haptics";
import React from "react";
import { Text } from "react-native";
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
      scale.value = withSpring(0.9, springs.snappy);
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

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[styles.item, containerStyle]}>
        <TabIcon
          routeName={routeName}
          isActive={isActive}
          activeColor={theme.colors.primary}
          inactiveColor={theme.colors.textTertiary}
        />
        <Text
          style={[
            styles.labelText,
            {
              color: isActive
                ? theme.colors.primary
                : theme.colors.textTertiary,
            },
          ]}
        >
          {label.toLowerCase()}
        </Text>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create((theme) => ({
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.xs,
    gap: 2,
  },
  labelText: {
    ...theme.typography.caption,
    textTransform: "lowercase",
    textAlign: "center",
  },
}));

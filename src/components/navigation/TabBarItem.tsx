import { springs } from "@/hooks/useSpring";
import { haptics } from "@/utils/haptics";
import React from "react";
import { Text, View } from "react-native";
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
  /** Unread count overlaid on the icon. Hidden when absent or zero. */
  badge?: number;
}

export function TabBarItem({
  routeName,
  label,
  isActive,
  onPress,
  onLongPress,
  badge,
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
        {/* The badge sits beside TabIcon, not inside it: TabIcon springs to
            1.3x on activation and the badge must not scale with it. */}
        <View style={styles.iconSlot}>
          <TabIcon
            routeName={routeName}
            isActive={isActive}
            activeColor={theme.colors.primary}
            inactiveColor={theme.colors.textTertiary}
          />
          {badge && badge > 0 ? (
            <View
              style={[styles.badge, { backgroundColor: theme.colors.primary }]}
            >
              <Text
                style={[
                  styles.badgeText,
                  { color: theme.colors.textOnPrimary },
                ]}
                numberOfLines={1}
              >
                {badge > 99 ? "99+" : badge}
              </Text>
            </View>
          ) : null}
        </View>
        <Text
          style={[
            styles.labelText,
            {
              color: isActive
                ? theme.colors.primary
                : theme.colors.textTertiary,
            },
          ]}
          numberOfLines={1}
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
    gap: theme.spacing.xs / 2,
  },
  iconSlot: {
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -10,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 4,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "700",
  },
  labelText: {
    ...theme.typography.caption,
    textTransform: "lowercase",
    textAlign: "center",
  },
}));

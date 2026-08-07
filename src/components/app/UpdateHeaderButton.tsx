import { NorboPressable } from "@/components/CustomPressable";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useAppUpdateStore } from "@/stores/app-update.store";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

/**
 * Update icon for the tab headers. Renders nothing until an optional update
 * is available (`useAppUpdateStore.available`, published by `UpdateGate`);
 * tapping it opens the compact update card. A slow bounce draws the eye
 * without the app ever interrupting the user with a popup.
 */
export function UpdateHeaderButton(): React.JSX.Element | null {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const available = useAppUpdateStore((s) => s.available);
  const setOpen = useAppUpdateStore((s) => s.setOpen);

  const bounce = useSharedValue(0);

  useEffect(() => {
    if (!available) {
      cancelAnimation(bounce);
      bounce.value = 0;
      return;
    }
    bounce.value = withRepeat(
      withSequence(
        withTiming(-4, { duration: 280, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 620, easing: Easing.bounce }),
        withDelay(1200, withTiming(0, { duration: 0 })),
      ),
      -1,
    );
    return () => cancelAnimation(bounce);
  }, [available, bounce]);

  const bounceStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bounce.value }],
  }));

  if (!available) return null;

  return (
    <NorboPressable
      scale="row"
      haptic="light"
      onPress={() => setOpen(true)}
      style={styles.button}
    >
      <Animated.View
        accessibilityRole="button"
        accessibilityLabel={t("appUpdate.availableTitle")}
        style={bounceStyle}
      >
        <IconSymbol
          name="arrow.down.circle"
          size={26}
          tintColor={theme.colors.primary}
        />
        <View style={[styles.dot, { backgroundColor: theme.colors.accent }]} />
      </Animated.View>
    </NorboPressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  button: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    position: "absolute",
    top: -1,
    right: -1,
    width: theme.spacing.sm,
    height: theme.spacing.sm,
    borderRadius: theme.radius.pill,
    borderWidth: 1.5,
    borderColor: theme.colors.background,
  },
}));

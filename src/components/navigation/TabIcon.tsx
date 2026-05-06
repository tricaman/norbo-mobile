import { IconSymbol } from "@/components/ui/IconSymbol";
import { springs } from "@/hooks/useSpring";
import React, { useEffect } from "react";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from "react-native-reanimated";

const ICONS: Record<string, { sf: string; filled: string }> = {
  index: {
    sf: "house",
    filled: "house.fill",
  },
  settings: {
    sf: "slider.horizontal.3",
    filled: "slider.horizontal.3",
  },
};

interface TabIconProps {
  routeName: string;
  isActive: boolean;
  activeColor: string;
  inactiveColor: string;
}

export function TabIcon({
  routeName,
  isActive,
  activeColor,
  inactiveColor,
}: TabIconProps) {
  const icon = ICONS[routeName] ?? ICONS.index;
  const color = isActive ? activeColor : inactiveColor;
  const scale = useSharedValue(1);

  useEffect(() => {
    if (isActive) {
      scale.value = withSequence(
        withSpring(1.3, springs.bouncy),
        withSpring(1, springs.bouncy),
      );
    }
  }, [isActive]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <IconSymbol
        name={isActive ? icon.filled : icon.sf}
        size={24}
        tintColor={color}
      />
    </Animated.View>
  );
}

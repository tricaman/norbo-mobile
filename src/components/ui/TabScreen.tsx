import { Screen } from "@/components/ui/Screen";
import { TabHeader } from "@/components/ui/TabHeader";
import { springs } from "@/hooks/useSpring";
import { getTabDirection } from "@/utils/tabDirection";
import { useIsFocused } from "@react-navigation/native";
import React, { useEffect } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import type { Edge } from "react-native-safe-area-context";

interface TabScreenProps {
  title?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  edges?: ReadonlyArray<Edge>;
  style?: StyleProp<ViewStyle>;
}

const TAB_SLIDE_OFFSET = 80;
const TAB_SLIDE_SPRING = springs.bouncy;

/**
 * TabScreen — canonical wrapper for every tab-root screen.
 * Combines Screen + TabHeader so layout is always consistent across tabs.
 */
export function TabScreen({
  title,
  right,
  children,
  edges,
  style,
}: TabScreenProps) {
  const isFocused = useIsFocused();
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (isFocused) {
      const dir = getTabDirection();
      const offset =
        dir === "right"
          ? TAB_SLIDE_OFFSET
          : dir === "left"
            ? -TAB_SLIDE_OFFSET
            : 0;
      translateX.value = offset;
      opacity.value = 0;
      translateX.value = withSpring(0, TAB_SLIDE_SPRING);
      opacity.value = withSpring(1, TAB_SLIDE_SPRING);
    }
  }, [isFocused]);

  const animStyle = useAnimatedStyle(() => ({
    flex: 1,
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  return (
    <Screen edges={edges} style={style}>
      {title && <TabHeader title={title} right={right} />}
      <Animated.View style={animStyle}>{children}</Animated.View>
    </Screen>
  );
}

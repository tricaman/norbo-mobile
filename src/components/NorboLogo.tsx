import { springs } from "@/hooks/useSpring";
import React, { useEffect } from "react";
import { Image } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";

interface Props {
  /**
   * Displayed width (and height) of the logo in pixels. The asset is square,
   * so the rendered glyph fits inside a `size` x `size` box and is scaled
   * with `resizeMode="contain"`.
   */
  size?: number;
}

const LOGO_SOURCE = require("../../assets/images/logo-base.png");

/**
 * The brand axolotl glyph. We render the official artwork directly to keep
 * pixel parity with the splash screen; a single bouncy scale-in fades the
 * logo onto the screen on mount.
 */
export function NorboLogo({ size = 40 }: Props) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(150, withSpring(1, springs.bouncy));
    opacity.value = withDelay(
      150,
      withTiming(1, { duration: 240, easing: Easing.out(Easing.quad) }),
    );
  }, [scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[{ width: size, height: size }, animatedStyle]}>
      <Image
        source={LOGO_SOURCE}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

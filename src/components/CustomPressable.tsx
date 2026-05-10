import { BlurMask, Canvas, Circle } from "@shopify/react-native-skia";
import React, { useCallback, useState } from "react";
import { StyleProp, View, ViewStyle } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useUnistyles } from "react-native-unistyles";
import { springs } from "../hooks/useSpring";
import { pressScale } from "../theme/tokens";
import { haptics, HapticWeight } from "../utils/haptics";

type ScalePreset = keyof typeof pressScale;

interface NorboPressableProps {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  haptic?: HapticWeight;
  scale?: ScalePreset;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  deep?: boolean;
  premium?: boolean;
  haloColor?: string;
}

const HALO_INSET = 44;

export function NorboPressable({
  children,
  onPress,
  onLongPress,
  haptic = "light",
  scale = "card",
  style,
  disabled = false,
  deep = false,
  premium = false,
  haloColor,
}: NorboPressableProps) {
  const { theme } = useUnistyles();
  const sv = useSharedValue(1);
  const opSv = useSharedValue(1);

  // Premium halo: press fades glow in while held; ripple expands on successful tap
  const press = useSharedValue(0);
  const ripple = useSharedValue(1); // idle = 1 (opacity = 0), animates 0 → 1 on tap

  const [size, setSize] = useState({ w: 0, h: 0 });

  const triggerPress = useCallback(() => {
    haptics[haptic]();
    onPress?.();
  }, [haptic, onPress]);

  const triggerLongPress = useCallback(() => {
    haptics.heavy();
    onLongPress?.();
  }, [onLongPress]);

  const gesture = Gesture.Tap()
    .enabled(!disabled)
    .maxDuration(10_000)
    .onBegin(() => {
      const target = deep ? pressScale[scale] * 0.92 : pressScale[scale];
      sv.value = withSpring(target, deep ? springs.slow : springs.default);
      if (deep) opSv.value = withSpring(0.8, springs.default);
      if (premium) {
        press.value = withTiming(1, {
          duration: 200,
          easing: Easing.out(Easing.cubic),
        });
      }
    })
    .onFinalize((_, success) => {
      sv.value = withSpring(1, springs.snappy);
      if (deep) opSv.value = withSpring(1, springs.snappy);
      if (premium) {
        press.value = withTiming(0, {
          duration: 350,
          easing: Easing.out(Easing.cubic),
        });
        if (success) {
          ripple.value = 0;
          ripple.value = withTiming(1, {
            duration: 700,
            easing: Easing.out(Easing.cubic),
          });
        }
      }
      if (success && onPress) runOnJS(triggerPress)();
    });

  const longPressGesture = Gesture.LongPress()
    .enabled(!disabled && !!onLongPress)
    .minDuration(500)
    .onStart(() => {
      if (onLongPress) runOnJS(triggerLongPress)();
    });

  const composed = Gesture.Race(longPressGesture, gesture);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sv.value }],
    opacity: disabled ? 0.4 : opSv.value,
  }));

  const canvasW = size.w + HALO_INSET * 2;
  const canvasH = size.h + HALO_INSET * 2;
  const cx = canvasW / 2;
  const cy = canvasH / 2;
  const baseR = Math.max(size.w, size.h) / 2;

  const heldR = useDerivedValue(() => baseR + 4 + press.value * 8);
  const heldOpacity = useDerivedValue(() => press.value * 0.4);
  const rippleR = useDerivedValue(() => baseR + 2 + ripple.value * 36);
  const rippleOpacity = useDerivedValue(() => (1 - ripple.value) * 0.55);

  const showHalo = premium && size.w > 0 && size.h > 0;
  const color = haloColor ?? theme.colors.primary;

  return (
    <GestureDetector gesture={composed}>
      <Animated.View
        style={[
          animStyle,
          style,
          premium ? { overflow: "visible" } : undefined,
        ]}
        onLayout={
          premium
            ? (e) => {
                const { width, height } = e.nativeEvent.layout;
                setSize((prev) =>
                  prev.w === width && prev.h === height
                    ? prev
                    : { w: width, h: height },
                );
              }
            : undefined
        }
      >
        {showHalo && (
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: -HALO_INSET,
              top: -HALO_INSET,
            }}
          >
            <Canvas style={{ width: canvasW, height: canvasH }}>
              <Circle
                cx={cx}
                cy={cy}
                r={heldR}
                color={color}
                opacity={heldOpacity}
              >
                <BlurMask blur={24} style="solid" />
              </Circle>
              <Circle
                cx={cx}
                cy={cy}
                r={rippleR}
                color={color}
                opacity={rippleOpacity}
                style="stroke"
                strokeWidth={1.5}
              >
                <BlurMask blur={5} style="solid" />
              </Circle>
            </Canvas>
          </View>
        )}
        {children}
      </Animated.View>
    </GestureDetector>
  );
}

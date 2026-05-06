import { springs } from "@/hooks/useSpring";
import type { ToastHandle, ToastOptions, ToastType } from "@/utils/toast";
import { Ionicons } from "@expo/vector-icons";
import { Canvas, RoundedRect } from "@shopify/react-native-skia";
import { BlurView } from "expo-blur";
import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Text, View, useWindowDimensions } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

// ── Types ────────────────────────────────────────────────────────────

interface ToastState {
  type: ToastType;
  title: string;
  subtitle?: string;
}

interface TypeConfig {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  accentColor: string;
  tintColor: string;
}

// ── Constants ────────────────────────────────────────────────────────

const CORNER_RADIUS = 20;
const HORIZONTAL_MARGIN = 16;

// ── Component ────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export const Toast = forwardRef<ToastHandle, {}>((_, ref) => {
  const { theme } = useUnistyles();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  const [state, setState] = useState<ToastState | null>(null);
  // Measured after layout — needed to give Skia Canvas explicit dimensions.
  const [cardSize, setCardSize] = useState({ width: 0, height: 0 });

  const translateY = useSharedValue(-140);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.92);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Animation helpers ─────────────────────────────────────────────

  const hideAnim = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    translateY.value = withSpring(-140, springs.snappy);
    scale.value = withSpring(0.92, springs.snappy);
    // Clear state only after the opacity spring has settled
    opacity.value = withSpring(0, springs.snappy, (finished) => {
      if (finished) runOnJS(setState)(null);
    });
  }, [translateY, opacity, scale]);

  const showAnim = useCallback(
    (opts: ToastOptions) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setState({ type: opts.type, title: opts.title, subtitle: opts.subtitle });
      // Reset to off-screen start position before animating in
      translateY.value = -140;
      opacity.value = 0;
      scale.value = 0.92;
      translateY.value = withSpring(0, {
        damping: 13,
        stiffness: 140,
        mass: 0.12,
      });
      opacity.value = withSpring(1, springs.snappy);
      scale.value = withSpring(1, { damping: 11, stiffness: 130, mass: 0.12 });
      timerRef.current = setTimeout(hideAnim, opts.duration ?? 3500);
    },
    [translateY, opacity, scale, hideAnim],
  );

  useImperativeHandle(ref, () => ({ show: showAnim, hide: hideAnim }), [
    showAnim,
    hideAnim,
  ]);

  // ── Animated style — runs on UI thread ────────────────────────────

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  // ── Swipe-up to dismiss ───────────────────────────────────────────

  const panGesture = Gesture.Pan()
    // Only activate on upward movement; ignore accidental downward swipes
    .activeOffsetY([-12, 6])
    .onUpdate((e) => {
      if (e.translationY < 0) {
        translateY.value = e.translationY;
        // Fade out as the card moves up
        opacity.value = Math.max(0, 1 + e.translationY / 100);
      }
    })
    .onEnd((e) => {
      const isDismiss = e.translationY < -48 || e.velocityY < -600;
      if (isDismiss) {
        runOnJS(hideAnim)();
      } else {
        // Snap back if the swipe didn't reach the threshold
        translateY.value = withSpring(0, springs.snappy);
        opacity.value = withSpring(1, springs.snappy);
      }
    });

  // ── Type-specific config ──────────────────────────────────────────

  const typeConfig: Record<ToastType, TypeConfig> = {
    success: {
      icon: "checkmark-circle",
      accentColor: theme.colors.success,
      tintColor: theme.colors.successSoft,
    },
    error: {
      icon: "close-circle",
      accentColor: theme.colors.error,
      tintColor: theme.colors.errorSoft,
    },
    warning: {
      icon: "warning",
      accentColor: theme.colors.warning,
      tintColor: theme.colors.warningSoft,
    },
  };

  if (!state) return null;

  const cfg = typeConfig[state.type];
  const cardWidth = screenWidth - HORIZONTAL_MARGIN * 2;
  const isDark = theme.colors.background === "#000000";

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[
          styles.wrapper,
          animStyle,
          {
            top: insets.top + 12,
            width: cardWidth,
            left: HORIZONTAL_MARGIN,
          },
        ]}
        onLayout={(e) =>
          setCardSize({
            width: e.nativeEvent.layout.width,
            height: e.nativeEvent.layout.height,
          })
        }
      >
        {/* Layer 1 — frosted glass blur */}
        <BlurView
          style={styles.fill}
          intensity={50}
          tint={
            isDark
              ? "systemUltraThinMaterialDark"
              : "systemUltraThinMaterialLight"
          }
        />

        {/* Layer 2 — Skia: colored tint fill over the blur */}
        {cardSize.width > 0 && (
          <Canvas
            style={[
              styles.fill,
              { width: cardSize.width, height: cardSize.height },
            ]}
          >
            {/* Dark: subtle *Soft tint (alpha already baked in). Light: full accent at
                 higher opacity so the type color reads clearly on the bright glass. */}
            <RoundedRect
              x={0}
              y={0}
              width={cardSize.width}
              height={cardSize.height}
              r={CORNER_RADIUS}
              color={cfg.tintColor}
              opacity={isDark ? 0.9 : 0.55}
            />
          </Canvas>
        )}

        {/* Layer 3 — content row */}
        <View style={styles.content}>
          <Ionicons
            name={cfg.icon}
            size={22}
            color={cfg.accentColor}
            style={styles.icon}
          />
          <View style={styles.textBlock}>
            <Text
              style={[styles.title, { color: theme.colors.textPrimary }]}
              numberOfLines={1}
            >
              {state.title}
            </Text>
            {state.subtitle ? (
              <Text
                style={[styles.subtitle, { color: theme.colors.textSecondary }]}
                numberOfLines={2}
              >
                {state.subtitle}
              </Text>
            ) : null}
          </View>
        </View>
      </Animated.View>
    </GestureDetector>
  );
});

Toast.displayName = "Toast";

// ── Styles ───────────────────────────────────────────────────────────

const styles = StyleSheet.create((theme) => ({
  wrapper: {
    position: "absolute",
    borderRadius: CORNER_RADIUS,
    overflow: "hidden",
    // Elevation for Android depth
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 12,
  },
  fill: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: CORNER_RADIUS,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.md,
  },
  icon: {
    flexShrink: 0,
  },
  textBlock: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...theme.typography.subhead,
  },
  subtitle: {
    ...theme.typography.footnote,
  },
}));

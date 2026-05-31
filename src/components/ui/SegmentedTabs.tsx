import { NorboPressable } from "@/components/CustomPressable";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { springs } from "@/hooks/useSpring";
import React, { useEffect, useRef, useState } from "react";
import {
  ScrollView,
  Text,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

export interface SegmentedTab<K extends string> {
  key: K;
  label: string;
  icon?: string;
}

interface SegmentedTabsProps<K extends string> {
  tabs: readonly SegmentedTab<K>[];
  value: K;
  onChange: (key: K) => void;
  style?: StyleProp<ViewStyle>;
}

interface TabLayout {
  x: number;
  width: number;
}

/**
 * SegmentedTabs — modern underline-style tab bar (Instagram / Apple Music /
 * App Store pattern). A primary-coloured indicator slides with a spring
 * under the active tab. Horizontally scrollable when content overflows,
 * with edge fade gradients to communicate scrollability.
 */
export function SegmentedTabs<K extends string>({
  tabs,
  value,
  onChange,
  style,
}: SegmentedTabsProps<K>) {
  const { theme } = useUnistyles();
  const scrollRef = useRef<ScrollView>(null);
  const [tabLayouts, setTabLayouts] = useState<Map<string, TabLayout>>(
    new Map(),
  );

  const activeIndex = Math.max(
    0,
    tabs.findIndex((t) => t.key === value),
  );

  const activeLayout = tabLayouts.get(value);
  const translateX = useSharedValue(activeLayout?.x ?? 0);
  const pillWidth = useSharedValue(activeLayout?.width ?? 0);

  useEffect(() => {
    if (!activeLayout) return;
    const isInitial = tabLayouts.size < tabs.length;
    if (isInitial) {
      translateX.value = activeLayout.x;
      pillWidth.value = activeLayout.width;
    } else {
      translateX.value = withSpring(activeLayout.x, springs.snappy);
      pillWidth.value = withSpring(activeLayout.width, springs.snappy);
    }

    scrollRef.current?.scrollTo({
      x: activeLayout.x - 40,
      animated: !isInitial,
    });
  }, [activeLayout, tabLayouts.size, tabs.length, translateX, pillWidth]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    width: pillWidth.value,
  }));

  function handleTabLayout(key: string, e: LayoutChangeEvent) {
    const { x, width } = e.nativeEvent.layout;
    setTabLayouts((prev) => new Map(prev).set(key, { x, width }));
  }

  const allLayoutsReady = tabLayouts.size === tabs.length;

  return (
    <View style={[styles.bar, style]}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.inner}>
          {tabs.map((tab) => {
            const isActive = value === tab.key;
            return (
              <View key={tab.key} onLayout={(e) => handleTabLayout(tab.key, e)}>
                <NorboPressable
                  style={styles.btn}
                  scale="row"
                  haptic="light"
                  onPress={() => onChange(tab.key)}
                >
                  {tab.icon ? (
                    <IconSymbol
                      name={tab.icon}
                      size={15}
                      tintColor={
                        isActive
                          ? theme.colors.textPrimary
                          : theme.colors.textTertiary
                      }
                    />
                  ) : null}
                  <Text
                    style={[
                      styles.label,
                      {
                        color: isActive
                          ? theme.colors.textPrimary
                          : theme.colors.textTertiary,
                      },
                      isActive && styles.labelActive,
                    ]}
                  >
                    {tab.label}
                  </Text>
                </NorboPressable>
              </View>
            );
          })}

          {allLayoutsReady ? (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.indicator,
                { backgroundColor: theme.colors.textPrimary },
                pillStyle,
              ]}
            />
          ) : null}
        </View>

        <View
          style={[styles.baseline, { backgroundColor: theme.colors.border }]}
          pointerEvents="none"
        />
      </ScrollView>
    </View>
  );
}

const INDICATOR_HEIGHT = 2;
const BAR_HEIGHT = 44;

const styles = StyleSheet.create((theme) => ({
  bar: {
    position: "relative",
  },
  scrollContent: {
    paddingHorizontal: 4,
  },
  inner: {
    flexDirection: "row",
    position: "relative",
    height: BAR_HEIGHT,
  },
  baseline: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: theme.hairline,
  },
  indicator: {
    position: "absolute",
    left: 0,
    bottom: 0,
    height: INDICATOR_HEIGHT,
    borderTopLeftRadius: INDICATOR_HEIGHT,
    borderTopRightRadius: INDICATOR_HEIGHT,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    height: BAR_HEIGHT,
    gap: 6,
  },
  label: {
    ...theme.typography.subhead,
    fontWeight: "500",
  },
  labelActive: {
    fontWeight: "600",
  },
}));

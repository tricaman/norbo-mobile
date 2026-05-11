import { NorboPressable } from "@/components/CustomPressable";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { springs } from "@/hooks/useSpring";
import React, { useEffect, useState } from "react";
import {
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

const PADDING = 4;

/**
 * SegmentedTabs — iOS-style segmented control. A surface-coloured pill
 * slides with a spring under the active tab against a muted `surface2`
 * background. Each tab can show an optional icon beside its label.
 * Full-width pressables — tap anywhere in the option to select.
 */
export function SegmentedTabs<K extends string>({
  tabs,
  value,
  onChange,
  style,
}: SegmentedTabsProps<K>) {
  const { theme } = useUnistyles();
  const [innerWidth, setInnerWidth] = useState(0);

  const activeIndex = Math.max(
    0,
    tabs.findIndex((t) => t.key === value),
  );

  const tabWidth = innerWidth > 0 ? innerWidth / tabs.length : 0;
  const translateX = useSharedValue(activeIndex * tabWidth);

  useEffect(() => {
    const next = activeIndex * tabWidth;
    if (innerWidth === 0) {
      translateX.value = next;
      return;
    }
    translateX.value = withSpring(next, springs.snappy);
  }, [activeIndex, tabWidth, innerWidth, translateX]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    width: tabWidth,
  }));

  function handleLayout(e: LayoutChangeEvent) {
    setInnerWidth(e.nativeEvent.layout.width);
  }

  return (
    <View
      style={[
        styles.bar,
        { backgroundColor: theme.colors.surface2 },
        style,
      ]}
    >
      <View style={styles.inner} onLayout={handleLayout}>
        {innerWidth > 0 ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.pill,
              {
                backgroundColor: theme.colors.surface,
                shadowColor: "#000",
              },
              pillStyle,
            ]}
          />
        ) : null}

        {tabs.map((tab) => {
          const isActive = value === tab.key;
          return (
            <NorboPressable
              key={tab.key}
              style={styles.btn}
              scale="row"
              haptic="light"
              onPress={() => onChange(tab.key)}
            >
              {tab.icon ? (
                <IconSymbol
                  name={tab.icon}
                  size={14}
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
                      : theme.colors.textSecondary,
                  },
                  isActive && styles.labelActive,
                ]}
              >
                {tab.label}
              </Text>
            </NorboPressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  bar: {
    padding: PADDING,
    borderRadius: theme.radius.lg,
  },
  inner: {
    flexDirection: "row",
    position: "relative",
    height: 38,
  },
  pill: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    borderRadius: theme.radius.md,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  btn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  label: {
    ...theme.typography.caption,
  },
  labelActive: {
    fontWeight: "600",
  },
}));

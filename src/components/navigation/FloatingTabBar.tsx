import { setTabDirection } from "@/utils/tabDirection";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import React, { useState } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { CIRCLE_SIZE, ServicesTabButton } from "./ServicesTabButton";
import { TabBarItem } from "./TabBarItem";

const CUTOUT_RADIUS = CIRCLE_SIZE / 2 + 8;

export function FloatingTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useUnistyles();
  const [barWidth, setBarWidth] = useState(0);

  const cx = barWidth / 2;
  const cutoutPath =
    barWidth > 0
      ? `M 0 0 L ${cx - CUTOUT_RADIUS} 0 A ${CUTOUT_RADIUS} ${CUTOUT_RADIUS} 0 0 1 ${cx + CUTOUT_RADIUS} 0 L ${barWidth} 0`
      : "";

  return (
    <View
      style={[styles.container, { paddingBottom: insets.bottom }]}
      onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
    >
      {barWidth > 0 && (
        <View style={styles.borderSvg} pointerEvents="none">
          <Svg width={barWidth} height={CUTOUT_RADIUS + 1}>
            <Path
              d={cutoutPath}
              stroke={theme.colors.border}
              strokeWidth={theme.hairline}
              fill="none"
            />
          </Svg>
        </View>
      )}
      <View style={styles.tabRow}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isActive = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isActive && !event.defaultPrevented) {
              setTabDirection(index > state.index ? "right" : "left");
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: "tabLongPress",
              target: route.key,
            });
          };

          if (route.name === "services") {
            return (
              <ServicesTabButton
                key={route.key}
                isActive={isActive}
                onPress={onPress}
                onLongPress={onLongPress}
              />
            );
          }

          return (
            <TabBarItem
              key={route.key}
              routeName={route.name}
              label={(options.tabBarLabel as string) ?? route.name}
              isActive={isActive}
              onPress={onPress}
              onLongPress={onLongPress}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    backgroundColor: theme.colors.background,
    borderTopWidth: theme.hairline,
    borderTopColor: theme.colors.border,
    overflow: "visible",
  },
  tabRow: {
    flexDirection: "row",
    paddingTop: theme.spacing.xs,
  },
  borderSvg: {
    position: "absolute",
    top: 0,
    left: 0,
  },
}));

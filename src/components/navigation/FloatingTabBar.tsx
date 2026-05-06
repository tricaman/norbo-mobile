import { setTabDirection } from "@/utils/tabDirection";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { BlurView } from "expo-blur";
import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet, UnistylesRuntime } from "react-native-unistyles";
import { TabBarItem } from "./TabBarItem";

export function FloatingTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const isDark = UnistylesRuntime.themeName === "dark";

  return (
    <View
      style={[styles.wrapper, { paddingBottom: insets.bottom + 12 }]}
      pointerEvents="box-none"
    >
      <View style={styles.container}>
        <BlurView
          intensity={65}
          tint={isDark ? "dark" : "light"}
          style={styles.blur}
        >
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
        </BlurView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  wrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  container: {
    borderRadius: theme.radius.pill,
    overflow: "hidden",
    borderColor: theme.colors.border2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
    backgroundColor: theme.colors.surface,
  },
  blur: {
    borderRadius: theme.radius.pill,
    overflow: "hidden",
  },
  tabRow: {
    flexDirection: "row",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    gap: theme.spacing.xs,
  },
}));

import React from "react";
import {
  Image as RNImage,
  StyleProp,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

type AvatarSize = "sm" | "md" | "lg" | "xl";

interface AvatarProps {
  /** Display name or username — first char is used as fallback initial. */
  name?: string | null;
  /** Optional image URL. When provided, renders an image instead of the initial. */
  source?: string | null;
  size?: AvatarSize;
  style?: StyleProp<ViewStyle>;
}

/**
 * Avatar — circular themed avatar. Size presets match theme.avatarSize tokens.
 * Renders the first character of `name` uppercase as placeholder content.
 */
export function Avatar({ name, source, size = "lg", style }: AvatarProps) {
  const { theme } = useUnistyles();
  const dimension = theme.avatarSize[size];
  const initial = (name ?? "?").charAt(0).toUpperCase() || "?";
  const radius = dimension / 2;

  return (
    <View
      style={[
        styles.avatar,
        { width: dimension, height: dimension, borderRadius: radius },
        style,
      ]}
    >
      {source ? (
        <RNImage
          source={{ uri: source }}
          style={{ width: dimension, height: dimension, borderRadius: radius }}
        />
      ) : (
        <Text style={size === "xl" ? styles.textLarge : styles.textDefault}>
          {initial}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  avatar: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border2,
    alignItems: "center",
    justifyContent: "center",
  },
  textDefault: {
    ...theme.typography.subhead,
    color: theme.colors.textSecondary,
  },
  textLarge: {
    ...theme.typography.title1,
    color: theme.colors.textSecondary,
  },
}));

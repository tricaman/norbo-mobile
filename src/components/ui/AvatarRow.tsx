import { NorboPressable } from "@/components/CustomPressable";
import { Avatar } from "@/components/ui/Avatar";
import type { ReactNode } from "react";
import React from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

type AvatarSize = "sm" | "md" | "lg" | "xl";

export interface AvatarRowProps {
  name: string;
  avatarSize?: AvatarSize;
  title: string;
  titleRight?: ReactNode;
  subtitle?: string;
  subtitleRight?: ReactNode;
  hint?: ReactNode;
  leading?: ReactNode;
  onPress: () => void;
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function AvatarRow({
  name,
  avatarSize = "md",
  title,
  titleRight,
  subtitle,
  subtitleRight,
  hint,
  leading,
  onPress,
  onLongPress,
  style,
}: AvatarRowProps) {
  const hasBottom = subtitle != null || subtitleRight != null;

  return (
    <NorboPressable
      style={[styles.row, style]}
      scale="row"
      haptic="light"
      onPress={onPress}
      onLongPress={onLongPress}
    >
      {leading}
      <Avatar name={name} size={avatarSize} />
      <View style={styles.content}>
        <View style={styles.rowTop}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {titleRight}
        </View>
        {hasBottom && (
          <View style={styles.rowBottom}>
            {subtitle != null && (
              <Text style={styles.subtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            )}
            {subtitleRight}
          </View>
        )}
        {hint}
      </View>
    </NorboPressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.lg,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  subtitle: {
    fontFamily: "DMMono-Regular",
    fontSize: 12,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  title: {
    ...theme.typography.subhead,
    color: theme.colors.textPrimary,
    flex: 1,
    marginRight: theme.spacing.sm,
    textTransform: "lowercase",
  },
}));

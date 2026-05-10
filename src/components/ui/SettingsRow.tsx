import { NorboPressable } from "@/components/CustomPressable";
import { IconSymbol } from "@/components/ui/IconSymbol";
import React from "react";
import { StyleProp, Text, TextStyle, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { SectionLabel } from "./SectionLabel";

export interface SettingsRowProps {
  iconName?: string;
  iconSize?: number;
  iconColor?: string;
  label: string;
  subtitle?: string;
  labelNumberOfLines?: number;
  labelStyle?: StyleProp<TextStyle>;
  right?: React.ReactNode;
  onPress?: () => void;
}

export function SettingsRow({
  iconName,
  iconSize = 18,
  iconColor,
  label,
  subtitle,
  labelNumberOfLines,
  labelStyle,
  right,
  onPress,
}: SettingsRowProps) {
  const { theme } = useUnistyles();

  const content = (
    <>
      {iconName && (
        <View style={styles.iconWrap}>
          <IconSymbol
            name={iconName}
            size={24}
            tintColor={iconColor ?? theme.colors.textSecondary}
          />
        </View>
      )}
      <View style={styles.rowContent}>
        <Text
          style={[styles.rowLabel, labelStyle]}
          numberOfLines={labelNumberOfLines}
        >
          {label}
        </Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      {right !== undefined ? (
        right
      ) : onPress ? (
        <IconSymbol
          name="chevron.right"
          size={13}
          tintColor={theme.colors.textTertiary}
        />
      ) : null}
    </>
  );

  if (onPress) {
    return (
      <NorboPressable
        style={styles.row}
        scale="row"
        haptic="light"
        onPress={onPress}
      >
        {content}
      </NorboPressable>
    );
  }

  return <View style={styles.row}>{content}</View>;
}

export function SettingsCard({
  children,
  title,
  dividerInset,
}: {
  children: React.ReactNode;
  title?: string;
  dividerInset?: number;
}) {
  const { theme } = useUnistyles();
  const defaultInset = 32 + theme.spacing.xl + theme.spacing.lg;
  const validChildren = React.Children.toArray(children);
  return (
    <View style={styles.card}>
      {title ? (
        <SectionLabel style={styles.cardTitle}>{title}</SectionLabel>
      ) : null}
      {validChildren.map((child, i) => (
        <React.Fragment key={i}>
          {child}
          {i < validChildren.length - 1 && (
            <View
              style={[
                styles.rowDivider,
                { marginLeft: dividerInset ?? defaultInset },
              ]}
            />
          )}
        </React.Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    overflow: "hidden",
  },
  cardTitle: {
    color: theme.colors.primary,
    paddingHorizontal: theme.spacing["2xl"],
    paddingVertical: theme.spacing.lg,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  rowDivider: {
    height: 0.5,
    marginLeft: 32 + theme.spacing.xl + theme.spacing.lg,
    backgroundColor: theme.colors.border,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.sm,
    // backgroundColor: theme.colors.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  rowContent: { flex: 1, gap: 2 },
  rowLabel: {
    ...theme.typography.subhead,
    color: theme.colors.textPrimary,
    textTransform: "lowercase",
  },
  rowSubtitle: {
    ...theme.typography.footnote,
    color: theme.colors.textSecondary,
  },
}));

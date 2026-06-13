import { Card } from "@/components/ui/Card";
import { IconSymbol } from "@/components/ui/IconSymbol";
import React from "react";
import { Text } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

type SymbolName = React.ComponentProps<typeof IconSymbol>["name"];

interface ActionTileProps {
  symbolName: SymbolName;
  label: string;
  onPress: () => void;
  variant?: "muted" | "primary";
}

export function ActionTile({
  symbolName,
  label,
  onPress,
  variant = "muted",
}: ActionTileProps) {
  const { theme } = useUnistyles();

  const iconColor =
    variant === "primary" ? theme.colors.primary : theme.colors.textSecondary;

  return (
    <Card style={styles.container} onPress={onPress}>
      <IconSymbol name={symbolName} size={24} tintColor={iconColor} />
      <Text
        style={variant === "primary" ? styles.labelPrimary : styles.labelMuted}
      >
        {label}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  labelMuted: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textTransform: "lowercase",
    textAlign: "center",
  },
  labelPrimary: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    textTransform: "lowercase",
    textAlign: "center",
  },
}));

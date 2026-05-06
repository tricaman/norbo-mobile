import { IconSymbol } from "@/components/ui/IconSymbol";
import React from "react";
import { TextInput, type TextInputProps, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

export function SearchInput({ style, ...props }: TextInputProps) {
  const { theme } = useUnistyles();

  return (
    <View style={styles.container}>
      <IconSymbol
        name="magnifyingglass"
        size={14}
        tintColor={theme.colors.textTertiary}
      />
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        placeholderTextColor={theme.colors.textTertiary}
        {...props}
        style={[styles.input, style]}
      />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: theme.typography.subhead.fontSize,
    fontWeight: theme.typography.subhead.fontWeight,
    color: theme.colors.textPrimary,
    paddingVertical: theme.spacing.xs,
  },
}));

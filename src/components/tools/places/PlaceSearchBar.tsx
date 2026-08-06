import { NorboPressable } from "@/components/CustomPressable";
import { IconSymbol } from "@/components/ui/IconSymbol";
import React from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Keyboard, TextInput, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

interface PlaceSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  onClear: () => void;
  loading: boolean;
}

/**
 * Search field floating over the map.
 *
 * Deliberately NOT built on `components/ui/SearchInput`: that primitive has
 * no surface of its own (no background, border or radius), so it is
 * unreadable over map tiles, and it has zero other consumers — widening it
 * for this one case would turn a generic control into a map-specific one.
 *
 * Submit-only by design: `onSubmit` fires on the keyboard's search key, not
 * on every keystroke. That keeps the paid geocoding path to one request per
 * deliberate user action.
 */
export function PlaceSearchBar({
  value,
  onChangeText,
  onSubmit,
  onClear,
  loading,
}: PlaceSearchBarProps) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();

  return (
    <View style={styles.card}>
      <IconSymbol
        name="magnifyingglass"
        size={16}
        tintColor={theme.colors.textTertiary}
      />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={() => {
          Keyboard.dismiss();
          onSubmit();
        }}
        placeholder={t("tools.places.search.placeholder")}
        placeholderTextColor={theme.colors.textTertiary}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={80}
      />
      {loading ? (
        <ActivityIndicator size="small" color={theme.colors.textTertiary} />
      ) : value.length > 0 ? (
        <NorboPressable haptic="light" scale="text" onPress={onClear}>
          <IconSymbol
            name="xmark.circle.fill"
            size={16}
            tintColor={theme.colors.textTertiary}
          />
        </NorboPressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: theme.hairline,
    borderColor: theme.colors.border,
    // Lift it off the map tiles, same treatment as the FABs.
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  input: {
    flex: 1,
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    // Android adds generous default padding that misaligns the row.
    paddingVertical: 0,
  },
}));

import { NorboPressable } from "@/components/CustomPressable";
import { KIND_META } from "@/components/tools/places/kind-meta";
import { PLACE_KINDS, type PlaceKind } from "@/types/place.types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { ScrollView, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

interface PlaceKindFilterBarProps {
  value: PlaceKind[];
  onChange: (kinds: PlaceKind[]) => void;
}

/**
 * Horizontal multi-select chip row for the map layers. The shared
 * `ChipSelector` is single-select (`value: T`) — this is a thin multi-select
 * variant reusing its ChipItem styling, deliberately NOT widening the shared
 * component. The last active chip cannot be turned off (the contract requires
 * ≥1 kind).
 */
export function PlaceKindFilterBar({ value, onChange }: PlaceKindFilterBarProps) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const selected = new Set(value);

  function toggle(kind: PlaceKind) {
    if (selected.has(kind)) {
      if (value.length === 1) return; // keep ≥1 layer on
      onChange(value.filter((k) => k !== kind));
    } else {
      onChange([...value, kind]);
    }
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
      style={styles.bar}
    >
      {PLACE_KINDS.map((kind) => {
        const isSelected = selected.has(kind);
        return (
          <NorboPressable
            key={kind}
            haptic="light"
            scale="row"
            onPress={() => toggle(kind)}
          >
            <View
              style={[
                styles.chip,
                {
                  backgroundColor: isSelected
                    ? theme.colors.primary
                    : theme.colors.surface,
                  borderColor: isSelected
                    ? theme.colors.primary
                    : theme.colors.border,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={
                  KIND_META[kind].icon as React.ComponentProps<
                    typeof MaterialCommunityIcons
                  >["name"]
                }
                size={14}
                color={
                  isSelected
                    ? theme.colors.textOnPrimary
                    : theme.colors.textTertiary
                }
              />
              <Text
                style={[
                  styles.label,
                  {
                    color: isSelected
                      ? theme.colors.textOnPrimary
                      : theme.colors.textSecondary,
                  },
                ]}
                numberOfLines={1}
              >
                {t(KIND_META[kind].labelKey as never)}
              </Text>
            </View>
          </NorboPressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create((theme) => ({
  bar: {
    position: "absolute",
    top: theme.spacing.sm,
    left: 0,
    right: 0,
    flexGrow: 0,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.xs,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
  },
  label: {
    ...theme.typography.footnote,
  },
}));

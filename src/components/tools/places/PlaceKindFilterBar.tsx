import { NorboPressable } from "@/components/CustomPressable";
import { getKindMeta } from "@/components/tools/places/kind-meta";
import type { PlaceKind } from "@/types/place.types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { ScrollView, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

interface PlaceKindFilterBarProps {
  /** The kinds this tool exposes — chips render in this order. */
  allowedKinds: PlaceKind[];
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
export function PlaceKindFilterBar({
  allowedKinds,
  value,
  onChange,
}: PlaceKindFilterBarProps) {
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
      {allowedKinds.map((kind) => {
        const isSelected = selected.has(kind);
        const meta = getKindMeta(kind);
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
                  meta.icon as React.ComponentProps<
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
                {meta.labelKey ? t(meta.labelKey as never) : kind.toLowerCase()}
              </Text>
            </View>
          </NorboPressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create((theme) => ({
  // Positioning is the parent's job: PlacesMapView stacks this under the
  // search bar in a single absolute column, so this must stay in flow.
  bar: {
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

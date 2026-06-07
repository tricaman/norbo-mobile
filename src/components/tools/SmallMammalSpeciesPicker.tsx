import { NorboPressable } from "@/components/CustomPressable";
import { SMALL_MAMMAL_SPECIES } from "@/hooks/useDogs";
import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, Text } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

/**
 * Tool-local species picker for small mammals (rabbit, hamster, …). Labels via
 * `tools.smallMammal.species.*`. Not a design-system primitive.
 */
export function SmallMammalSpeciesPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (species: string) => void;
}): React.JSX.Element {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.track}
    >
      {SMALL_MAMMAL_SPECIES.map((s) => {
        const selected = s === value;
        return (
          <NorboPressable
            key={s}
            scale="text"
            haptic="light"
            onPress={() => onChange(s)}
            style={[
              styles.chip,
              selected && {
                backgroundColor: theme.colors.primarySoft,
                borderColor: theme.colors.primary,
              },
            ]}
          >
            <Text
              style={[
                styles.label,
                {
                  color: selected
                    ? theme.colors.textPrimary
                    : theme.colors.textSecondary,
                },
              ]}
            >
              {t(`tools.smallMammal.species.${s}` as never)}
            </Text>
          </NorboPressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create((theme) => ({
  track: { gap: theme.spacing.sm, paddingVertical: theme.spacing.xs },
  chip: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface,
    borderWidth: theme.hairline,
    borderColor: theme.colors.border,
  },
  label: { ...theme.typography.footnote },
}));

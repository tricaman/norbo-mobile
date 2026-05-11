import { NorboPressable } from "@/components/CustomPressable";
import { IconSymbol } from "@/components/ui/IconSymbol";
import React from "react";
import {
  Text,
  View,
  type DimensionValue,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

export interface ChipOption<T> {
  value: T;
  label: string;
  icon?: string;
}

interface ChipSelectorProps<T> {
  options: readonly ChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
  style?: StyleProp<ViewStyle>;
}

interface ChipItemProps {
  label: string;
  icon?: string;
  isSelected: boolean;
  onPress: () => void;
  flexBasis: DimensionValue;
}

function ChipItem({
  label,
  icon,
  isSelected,
  onPress,
  flexBasis,
}: ChipItemProps) {
  const { theme } = useUnistyles();

  const tintedBackground = theme.colors.primary + "20";

  return (
    <NorboPressable
      haptic="light"
      scale="row"
      onPress={onPress}
      style={[styles.pressable, { flexBasis }]}
    >
      <View
        style={[
          styles.chip,
          {
            backgroundColor: isSelected
              ? tintedBackground
              : theme.colors.surface,
            borderColor: isSelected
              ? theme.colors.primary
              : theme.colors.border,
          },
        ]}
      >
        {icon !== undefined ? (
          <IconSymbol
            name={icon}
            size={16}
            tintColor={
              isSelected ? theme.colors.primary : theme.colors.textTertiary
            }
          />
        ) : null}
        <Text
          style={[
            styles.label,
            {
              color: isSelected
                ? theme.colors.primary
                : theme.colors.textSecondary,
            },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </View>
    </NorboPressable>
  );
}

function calculateFlexBasis(totalCount: number, index: number): DimensionValue {
  if (totalCount === 1) return "100%";
  if (totalCount === 2) return "48%";
  if (totalCount === 3) return "31%";

  const itemsPerRow = totalCount % 3 === 0 ? 3 : 2;
  const fullRows = Math.floor(totalCount / itemsPerRow);
  const remainder = totalCount % itemsPerRow;

  const currentRow = Math.floor(index / itemsPerRow);
  const isLastRow = currentRow === fullRows && remainder > 0;

  if (isLastRow) {
    return remainder === 3 ? "31%" : "48%";
  }

  return itemsPerRow === 3 ? "31%" : "48%";
}

export function ChipSelector<T>({
  options,
  value,
  onChange,
  style,
}: ChipSelectorProps<T>) {
  return (
    <View style={[styles.grid, style]}>
      {options.map((option, index) => {
        const flexBasis = calculateFlexBasis(options.length, index);
        return (
          <ChipItem
            key={String(option.value)}
            label={option.label}
            icon={option.icon}
            isSelected={option.value === value}
            onPress={() => onChange(option.value)}
            flexBasis={flexBasis}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  pressable: {
    flexBasis: "48%",
    flexGrow: 1,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 9,
    borderRadius: theme.radius.md,
    borderWidth: theme.hairline,
  },
  label: {
    ...theme.typography.caption,
    fontWeight: "500",
    flexShrink: 1,
  },
}));

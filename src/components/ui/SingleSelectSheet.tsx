import { NorboPressable } from "@/components/CustomPressable";
import { IconSymbol } from "@/components/ui/IconSymbol";
import React, { useCallback, useState } from "react";
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  Text,
  View,
  type ListRenderItemInfo,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface SingleSelectOption<T extends string> {
  value: T;
  label: string;
  /** Optional render function for a leading element (icon, avatar…). */
  leading?: () => React.ReactNode;
}

interface SingleSelectSheetProps<T extends string> {
  options: readonly SingleSelectOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Label shown in the sheet header. */
  title: string;
  /** Optional placeholder when no value matches any option. */
  placeholder?: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function SingleSelectSheet<T extends string>({
  options,
  value,
  onChange,
  title,
  placeholder,
}: SingleSelectSheetProps<T>): React.ReactElement {
  const { theme } = useUnistyles();
  const [visible, setVisible] = useState(false);

  const selectedOption = options.find((o) => o.value === value);
  const triggerLabel = selectedOption?.label ?? placeholder ?? title;
  const hasSelection = !!selectedOption;

  function handleSelect(optionValue: T) {
    onChange(optionValue);
    setVisible(false);
  }

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<SingleSelectOption<T>>) => {
      const isActive = item.value === value;
      return (
        <NorboPressable
          scale="row"
          haptic="light"
          onPress={() => handleSelect(item.value)}
          style={[
            styles.row,
            isActive && {
              backgroundColor: theme.colors.primarySoft,
            },
          ]}
        >
          {item.leading?.()}
          <Text
            style={[
              styles.rowLabel,
              {
                color: isActive
                  ? theme.colors.primary
                  : theme.colors.textPrimary,
                fontWeight: isActive ? "600" : "400",
              },
            ]}
            numberOfLines={1}
          >
            {item.label}
          </Text>
          {isActive && (
            <IconSymbol
              name="checkmark"
              size={18}
              tintColor={theme.colors.primary}
            />
          )}
        </NorboPressable>
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [value, theme],
  );

  return (
    <>
      {/* Trigger */}
      <NorboPressable
        scale="row"
        haptic="light"
        onPress={() => setVisible(true)}
        style={[
          styles.trigger,
          {
            backgroundColor: hasSelection
              ? theme.colors.primarySoft
              : theme.colors.surface,
            borderColor: hasSelection
              ? theme.colors.primaryBorder
              : theme.colors.border,
          },
        ]}
      >
        {selectedOption?.leading?.()}
        <Text
          style={[
            styles.triggerLabel,
            {
              color: hasSelection
                ? theme.colors.primary
                : theme.colors.textTertiary,
            },
          ]}
          numberOfLines={1}
        >
          {triggerLabel}
        </Text>
        <IconSymbol
          name="chevron.down"
          size={12}
          tintColor={
            hasSelection ? theme.colors.primary : theme.colors.textTertiary
          }
        />
      </NorboPressable>

      {/* Sheet */}
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        <GestureHandlerRootView style={styles.backdrop}>
          <Pressable
            style={styles.backdropTap}
            onPress={() => setVisible(false)}
          />
          <View style={styles.sheet}>
            {/* Header */}
            <View style={styles.sheetHeader}>
              <Text
                style={[
                  styles.sheetTitle,
                  { color: theme.colors.textPrimary },
                ]}
              >
                {title}
              </Text>
            </View>

            {/* Options list */}
            <FlatList
              data={options as unknown as SingleSelectOption<T>[]}
              keyExtractor={(item) => item.value}
              renderItem={renderItem}
              ItemSeparatorComponent={() => (
                <View
                  style={[
                    styles.separator,
                    { backgroundColor: theme.colors.border },
                  ]}
                />
              )}
              style={styles.list}
              bounces={false}
              keyboardShouldPersistTaps="handled"
            />
          </View>
        </GestureHandlerRootView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create((theme) => ({
  /* Trigger */
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.pill,
    borderWidth: theme.hairline,
    alignSelf: "flex-start",
    height: 36,
  },
  triggerLabel: {
    ...theme.typography.footnote,
    fontWeight: "600",
    flexShrink: 1,
  },

  /* Modal */
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  backdropTap: {
    flex: 1,
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    maxHeight: "60%",
    paddingBottom:
      Platform.OS === "ios" ? theme.spacing["3xl"] : theme.spacing.xl,
  },
  sheetHeader: {
    alignItems: "center",
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: theme.hairline,
    borderBottomColor: theme.colors.border,
  },
  sheetTitle: {
    ...theme.typography.subhead,
    fontWeight: "600",
  },

  /* Rows */
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    minHeight: 48,
  },
  rowLabel: {
    ...theme.typography.body,
    flex: 1,
  },
  separator: {
    height: theme.hairline,
    marginLeft: theme.spacing.xl,
  },
  list: {
    flexShrink: 1,
  },
}));

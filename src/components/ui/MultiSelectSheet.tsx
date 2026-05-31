import { NorboPressable } from "@/components/CustomPressable";
import { IconSymbol } from "@/components/ui/IconSymbol";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
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

export interface MultiSelectOption<T extends string> {
  value: T;
  label: string;
  /** Optional render function for a leading element (avatar, icon…). */
  leading?: () => React.ReactNode;
}

interface MultiSelectSheetProps<T extends string> {
  options: readonly MultiSelectOption<T>[];
  /** Currently selected values. Empty array = nothing explicitly selected. */
  selected: T[];
  onChange: (selected: T[]) => void;
  /** Label shown in the sheet header. */
  title: string;
  /** Label for the "select all" row. */
  allLabel: string;
  /** Semantics: when `selected` is empty, treat it as "all selected". */
  emptyMeansAll?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function MultiSelectSheet<T extends string>({
  options,
  selected,
  onChange,
  title,
  allLabel,
  emptyMeansAll = true,
}: MultiSelectSheetProps<T>): React.ReactElement {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const [visible, setVisible] = useState(false);
  const [draft, setDraft] = useState<T[]>([]);

  const isAllSelected = emptyMeansAll
    ? selected.length === 0
    : selected.length === options.length;

  /* -- Trigger label ------------------------------------------------ */
  const triggerLabel = isAllSelected
    ? allLabel
    : selected.length === 1
      ? options.find((o) => o.value === selected[0])?.label ?? allLabel
      : `${selected.length} ${title.toLowerCase()}`;

  /* -- Open / Close ------------------------------------------------- */
  function open() {
    setDraft([...selected]);
    setVisible(true);
  }

  function handleDone() {
    onChange(draft);
    setVisible(false);
  }

  function handleCancel() {
    setVisible(false);
  }

  /* -- Draft toggles ------------------------------------------------ */
  const isDraftAll = emptyMeansAll
    ? draft.length === 0
    : draft.length === options.length;

  function toggleAll() {
    setDraft([]);
  }

  function toggleItem(value: T) {
    setDraft((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value],
    );
  }

  /* -- Render rows -------------------------------------------------- */
  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<MultiSelectOption<T>>) => {
      const isActive = draft.includes(item.value);
      return (
        <NorboPressable
          scale="row"
          haptic="light"
          onPress={() => toggleItem(item.value)}
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
    [draft, theme],
  );

  return (
    <>
      {/* Trigger */}
      <NorboPressable
        scale="row"
        haptic="light"
        onPress={open}
        style={[
          styles.trigger,
          {
            backgroundColor: isAllSelected
              ? "transparent"
              : theme.colors.primarySoft,
            borderColor: isAllSelected
              ? theme.colors.border
              : theme.colors.primaryBorder,
          },
        ]}
      >
        <Text
          style={[
            styles.triggerLabel,
            {
              color: isAllSelected
                ? theme.colors.textTertiary
                : theme.colors.primary,
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
            isAllSelected ? theme.colors.textTertiary : theme.colors.primary
          }
        />
      </NorboPressable>

      {/* Sheet */}
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={handleCancel}
      >
        <GestureHandlerRootView style={styles.backdrop}>
          <Pressable style={styles.backdropTap} onPress={handleCancel} />
          <View style={styles.sheet}>
            {/* Header */}
            <View style={styles.sheetHeader}>
              <NorboPressable
                scale="row"
                haptic="light"
                onPress={handleCancel}
                style={styles.sheetAction}
              >
                <Text style={[styles.sheetActionText, styles.cancelText]}>
                  {t("common.cancel")}
                </Text>
              </NorboPressable>
              <Text style={[styles.sheetTitle, { color: theme.colors.textPrimary }]}>
                {title}
              </Text>
              <NorboPressable
                scale="row"
                haptic="medium"
                onPress={handleDone}
                style={styles.sheetAction}
              >
                <Text style={[styles.sheetActionText, styles.doneText]}>
                  {t("common.done")}
                </Text>
              </NorboPressable>
            </View>

            {/* "All" row */}
            <NorboPressable
              scale="row"
              haptic="light"
              onPress={toggleAll}
              style={[
                styles.row,
                {
                  borderBottomWidth: theme.hairline,
                  borderBottomColor: theme.colors.border,
                  backgroundColor: isDraftAll
                    ? theme.colors.primarySoft
                    : "transparent",
                },
              ]}
            >
              <Text
                style={[
                  styles.rowLabel,
                  {
                    color: theme.colors.textPrimary,
                    fontWeight: isDraftAll ? "600" : "400",
                  },
                ]}
              >
                {allLabel}
              </Text>
              {isDraftAll && (
                <IconSymbol
                  name="checkmark"
                  size={18}
                  tintColor={theme.colors.primary}
                />
              )}
            </NorboPressable>

            {/* Options list */}
            <FlatList
              data={options as unknown as MultiSelectOption<T>[]}
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
  /* Trigger chip */
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
    paddingBottom: Platform.OS === "ios" ? theme.spacing["3xl"] : theme.spacing.xl,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
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
  sheetAction: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
  },
  sheetActionText: {
    ...theme.typography.subhead,
  },
  cancelText: {
    color: theme.colors.textSecondary,
  },
  doneText: {
    color: theme.colors.primary,
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

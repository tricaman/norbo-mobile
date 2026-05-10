import { IconSymbol } from "@/components/ui/IconSymbol";
import React from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { NorboPressable } from "../CustomPressable";

export interface DropdownItem {
  label: string;
  icon?: string;
  onPress: () => void;
  destructive?: boolean;
}

interface DropdownProps {
  visible: boolean;
  onClose: () => void;
  items: DropdownItem[];
}

export function Dropdown({ visible, onClose, items }: DropdownProps) {
  const { theme } = useUnistyles();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.card}>
          {items.map((item, index) => (
            <NorboPressable
              key={index}
              style={styles.item}
              haptic="medium"
              scale="row"
              onPress={() => {
                onClose();
                item.onPress();
              }}
            >
              {item.icon && (
                <IconSymbol
                  name={item.icon}
                  size={16}
                  tintColor={
                    item.destructive
                      ? theme.colors.error
                      : theme.colors.textSecondary
                  }
                />
              )}
              <Text
                style={
                  item.destructive
                    ? styles.itemTextDestructive
                    : styles.itemText
                }
              >
                {item.label}
              </Text>
            </NorboPressable>
          ))}
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create((theme) => ({
  overlay: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: 90,
    paddingRight: theme.spacing.lg,
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    minWidth: 180,
    overflow: "hidden",
  },
  item: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  itemText: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
  },
  itemTextDestructive: {
    ...theme.typography.body,
    color: theme.colors.error,
  },
}));

import { IconSymbol } from "@/components/ui/IconSymbol";
import React, { useMemo, useState } from "react";
import {
  LayoutChangeEvent,
  Modal,
  Pressable,
  Text,
  useWindowDimensions,
  View,
  ViewStyle,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { NorboPressable } from "../CustomPressable";

export interface DropdownItem {
  label: string;
  icon?: string;
  onPress: () => void;
  destructive?: boolean;
}

export interface DropdownAnchor {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DropdownProps {
  visible: boolean;
  onClose: () => void;
  items: DropdownItem[];
  /**
   * Optional anchor rect in window coords (e.g. from `measureInWindow`).
   * When provided, the menu opens just below the anchor's bottom-left,
   * clamped to the viewport. When omitted, the menu falls back to the
   * top-right header overflow position.
   */
  anchor?: DropdownAnchor | null;
}

const EDGE_MARGIN = 12;
const ANCHOR_GAP = 6;

export function Dropdown({ visible, onClose, items, anchor }: DropdownProps) {
  const { theme } = useUnistyles();
  const { width: winWidth, height: winHeight } = useWindowDimensions();
  const [cardSize, setCardSize] = useState<{ w: number; h: number } | null>(
    null,
  );

  const onCardLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (
      !cardSize ||
      Math.abs(cardSize.w - width) > 0.5 ||
      Math.abs(cardSize.h - height) > 0.5
    ) {
      setCardSize({ w: width, h: height });
    }
  };

  const anchoredStyle: ViewStyle | null = useMemo(() => {
    if (!anchor) return null;
    const w = cardSize?.w ?? 0;
    const h = cardSize?.h ?? 0;
    let left = anchor.x;
    if (w > 0) {
      left = Math.min(
        Math.max(EDGE_MARGIN, anchor.x),
        winWidth - w - EDGE_MARGIN,
      );
    }
    let top = anchor.y + anchor.height + ANCHOR_GAP;
    if (h > 0 && top + h > winHeight - EDGE_MARGIN) {
      // Flip above the anchor when there is no room below.
      top = Math.max(EDGE_MARGIN, anchor.y - h - ANCHOR_GAP);
    }
    return {
      position: "absolute",
      left,
      top,
      opacity: cardSize ? 1 : 0,
    };
  }, [anchor, cardSize, winWidth, winHeight]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <GestureHandlerRootView
        style={anchor ? styles.overlayAnchored : styles.overlay}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View
          style={[styles.card, anchoredStyle]}
          onLayout={anchor ? onCardLayout : undefined}
        >
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
  overlayAnchored: {
    flex: 1,
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

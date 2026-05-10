import { Ionicons } from "@expo/vector-icons";
import React from "react";

const ICON_MAP: Record<string, React.ComponentProps<typeof Ionicons>["name"]> =
  {
    // Navigation
    "chevron.left": "chevron-back",
    "chevron.right": "chevron-forward",

    // Actions
    checkmark: "checkmark",
    magnifyingglass: "search",
    "square.and.pencil": "create-outline",

    // People
    person: "person-outline",
    "person.fill": "person",
    "person.circle": "person-circle-outline",
    "person.circle.fill": "person-circle",
    "person.crop.circle": "person-circle-outline",

    // Shapes & misc
    circle: "ellipse-outline",
    "circle.fill": "ellipse",
    at: "at",
    envelope: "mail-outline",
    gearshape: "settings-outline",
    globe: "globe-outline",
    "slider.horizontal.3": "options-outline",
    "text.quote": "reader-outline",
    "doc.text": "document-text-outline",
    trash: "trash-outline",
    "person.badge.plus": "person-add-outline",

    // Pets
    pawprint: "paw-outline",
    "pawprint.fill": "paw",
    "plus.circle.fill": "add-circle",
    plus: "add",
    pencil: "pencil",
    "ellipsis.circle": "ellipsis-horizontal-circle-outline",
    "trash.fill": "trash",
    "xmark.circle.fill": "close-circle",

    // Auth
    "arrow.right.circle": "log-out-outline",

    // Settings
    "questionmark.circle": "help-circle-outline",
    "hand.raised": "shield-checkmark-outline",
    key: "key-outline",
  };

export type IconSymbolName = keyof typeof ICON_MAP;

type IconSymbolProps = {
  name: string;
  size?: number;
  tintColor?: string;
  color?: string;
};

export function IconSymbol({
  name,
  size = 24,
  tintColor,
  color,
}: IconSymbolProps) {
  const iconName = ICON_MAP[name] ?? "help-circle-outline";
  return <Ionicons name={iconName} size={size} color={tintColor ?? color} />;
}

import { Ionicons } from "@expo/vector-icons";
import React from "react";

const ICON_MAP: Record<string, React.ComponentProps<typeof Ionicons>["name"]> =
  {
    // Navigation
    "chevron.left": "chevron-back",
    "chevron.right": "chevron-forward",
    "chevron.up": "chevron-up",
    "chevron.down": "chevron-down",

    // Actions
    checkmark: "checkmark",
    magnifyingglass: "search",
    "square.and.pencil": "create-outline",
    calendar: "calendar-outline",
    "photo.on.rectangle": "image-outline",
    creditcard: "card-outline",
    "creditcard.fill": "card",
    wallet: "wallet-outline",
    "wallet.fill": "wallet",
    heart: "heart-outline",
    "heart.fill": "heart",
    bell: "notifications-outline",
    "bell.fill": "notifications-sharp",
    photo: "image-outline",
    scalemass: "barbell-outline",

    // People
    person: "person-outline",
    "person.fill": "person-sharp",
    "person.circle": "person-circle-outline",
    "person.circle.fill": "person-circle-sharp",
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
    "pawprint.fill": "paw-sharp",
    "plus.circle.fill": "add-circle",
    plus: "add",
    pencil: "pencil",
    "ellipsis.horizontal": "ellipsis-horizontal",
    "ellipsis.circle": "ellipsis-horizontal-circle-outline",
    "trash.fill": "trash",
    xmark: "close",
    "xmark.circle.fill": "close-circle",

    // Auth
    "arrow.right.circle": "log-out-outline",
    "arrow.right.square": "exit-outline",

    // Settings
    "questionmark.circle": "help-circle-outline",
    "exclamationmark.bubble": "chatbubble-ellipses-outline",
    paintpalette: "color-palette-outline",
    "hand.raised": "shield-checkmark-outline",
    key: "key-outline",

    // Pet events
    syringe: "bandage-outline",
    stethoscope: "medkit-outline",
    "shield.checkerboard": "shield-checkmark-outline",
    "shield.fill": "shield",
    scissors: "cut-outline",
    "drop.fill": "water",
    "arrow.triangle.2.circlepath": "refresh",
    "leaf.fill": "leaf",
    "fork.knife": "restaurant-outline",
    "pill.fill": "flask-outline",
    "camera.fill": "camera",
    "note.text": "document-text-outline",
    home: "home-outline",
    "house.fill": "home-sharp",
    cog: "cog-outline",
    "cog.fill": "cog-sharp",
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

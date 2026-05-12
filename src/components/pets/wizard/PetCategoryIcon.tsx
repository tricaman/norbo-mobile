import type { PetCategory } from "@/types/pet.types";
import { FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { CATEGORY_META } from "./category-meta";

interface PetCategoryIconProps {
  category: PetCategory;
  size?: number;
  color?: string;
}

/**
 * Icons that exist in FontAwesome5 but not in MaterialCommunityIcons.
 */
const FONT_AWESOME_ONLY_ICONS = new Set(["frog"]);

/**
 * Scale factor for FontAwesome5 icons to match MaterialCommunityIcons sizing.
 * FontAwesome5 icons render larger than MaterialCommunityIcons at the same size value.
 */
const FONT_AWESOME_SCALE_FACTOR = 0.85;

/**
 * PetCategoryIcon — single source of truth for the glyph that
 * represents a `PetCategory`. Primarily backed by MaterialCommunityIcons
 * because Ionicons lacks animal-specific glyphs. Falls back to FontAwesome5
 * for icons that don't exist in MaterialCommunityIcons (e.g., frog).
 */
export function PetCategoryIcon({
  category,
  size = 24,
  color,
}: PetCategoryIconProps) {
  const meta = CATEGORY_META[category];
  const useFontAwesome = FONT_AWESOME_ONLY_ICONS.has(meta.icon);

  if (useFontAwesome) {
    return (
      <FontAwesome5
        name={meta.icon as React.ComponentProps<typeof FontAwesome5>["name"]}
        size={size * FONT_AWESOME_SCALE_FACTOR}
        color={color}
        solid
      />
    );
  }

  return (
    <MaterialCommunityIcons
      // The mapping is strict at the type level — runtime cast is
      // safe because `CATEGORY_META` only references valid glyph names.
      name={
        meta.icon as React.ComponentProps<typeof MaterialCommunityIcons>["name"]
      }
      size={size}
      color={color}
    />
  );
}

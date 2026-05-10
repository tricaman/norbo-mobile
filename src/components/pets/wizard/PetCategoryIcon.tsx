import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import type { PetCategory } from "@/types/pet.types";
import { CATEGORY_META } from "./category-meta";

interface PetCategoryIconProps {
  category: PetCategory;
  size?: number;
  color?: string;
}

/**
 * PetCategoryIcon — single source of truth for the glyph that
 * represents a `PetCategory`. Backed by `MaterialCommunityIcons`
 * because Ionicons lacks animal-specific glyphs.
 */
export function PetCategoryIcon({
  category,
  size = 24,
  color,
}: PetCategoryIconProps) {
  const meta = CATEGORY_META[category];
  return (
    <MaterialCommunityIcons
      // The mapping is strict at the type level — runtime cast is
      // safe because `CATEGORY_META` only references valid glyph names.
      name={meta.icon as React.ComponentProps<typeof MaterialCommunityIcons>["name"]}
      size={size}
      color={color}
    />
  );
}

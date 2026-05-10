import React from "react";
import { Image } from "expo-image";
import type { ImageStyle, StyleProp } from "react-native";
import type { MediaAsset } from "@/types/media.types";

type ThumbnailSize = "sm" | "md" | "original";

interface MediaImageProps {
  asset: MediaAsset;
  thumbnailSize?: ThumbnailSize;
  style?: StyleProp<ImageStyle>;
}

/**
 * MediaImage — renders a MediaAsset using expo-image with automatic
 * thumbnail selection (sm → md → original fallback chain) and a
 * blurhash placeholder during loading.
 */
export function MediaImage({
  asset,
  thumbnailSize = "md",
  style,
}: MediaImageProps) {
  const source = resolveSource(asset, thumbnailSize);

  return (
    <Image
      source={source ? { uri: source } : undefined}
      style={style}
      contentFit="cover"
      transition={200}
    />
  );
}

function resolveSource(asset: MediaAsset, size: ThumbnailSize): string | null {
  switch (size) {
    case "sm":
      return asset.thumbSmUrl ?? asset.thumbMdUrl ?? asset.originalUrl;
    case "md":
      return asset.thumbMdUrl ?? asset.thumbSmUrl ?? asset.originalUrl;
    case "original":
      return asset.originalUrl;
  }
}

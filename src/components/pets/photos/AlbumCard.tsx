import { NorboPressable } from "@/components/CustomPressable";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { mediaApi } from "@/services/media.api";
import type { PhotoAlbum } from "@/types/photo-album.types";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import React from "react";
import { Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

interface AlbumCardProps {
  album: PhotoAlbum;
  size: number;
  onPress: () => void;
}

export function AlbumCard({
  album,
  size,
  onPress,
}: AlbumCardProps): React.ReactElement {
  const { theme } = useUnistyles();

  const coverQuery = useQuery({
    queryKey: ["media", album.coverAssetId],
    queryFn: () => mediaApi.getAsset(album.coverAssetId!).then((r) => r.data),
    enabled: !!album.coverAssetId,
    staleTime: 5 * 60 * 1000,
  });

  const coverUri =
    coverQuery.data?.thumbMdUrl ??
    coverQuery.data?.thumbSmUrl ??
    coverQuery.data?.originalUrl;

  return (
    <NorboPressable
      style={[
        styles.card,
        {
          width: size,
          backgroundColor: theme.colors.surface,
        },
      ]}
      scale="row"
      haptic="light"
      onPress={onPress}
    >
      <View
        style={[
          styles.cover,
          { height: size, backgroundColor: theme.colors.backgroundSecondary },
        ]}
      >
        {coverUri ? (
          <Image
            source={{ uri: coverUri }}
            style={{ width: size, height: size }}
            contentFit="cover"
          />
        ) : (
          <View style={styles.placeholder}>
            <IconSymbol
              name="photo.on.rectangle"
              size={32}
              tintColor={theme.colors.textTertiary}
            />
          </View>
        )}

        <View
          style={[styles.countBadge, { backgroundColor: theme.colors.scrim }]}
        >
          <Text style={styles.countText}>{album.mediaAssetIds.length}</Text>
        </View>
      </View>

      <View style={styles.info}>
        <Text
          style={[styles.title, { color: theme.colors.textPrimary }]}
          numberOfLines={1}
        >
          {album.title}
        </Text>
        {album.description ? (
          <Text
            style={[styles.description, { color: theme.colors.textSecondary }]}
            numberOfLines={1}
          >
            {album.description}
          </Text>
        ) : null}
      </View>
    </NorboPressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    overflow: "hidden",
    ...theme.card,
  },
  cover: {
    position: "relative",
  },
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  countBadge: {
    position: "absolute",
    bottom: theme.spacing.xs,
    right: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.radius.pill,
  },
  countText: {
    ...theme.typography.caption,
    color: "#fff",
    fontWeight: "700",
  },
  info: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    gap: 2,
  },
  title: {
    ...theme.typography.subhead,
    fontWeight: "600",
  },
  description: {
    ...theme.typography.caption,
  },
}));

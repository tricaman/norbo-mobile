import { NorboPressable } from "@/components/CustomPressable";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { SCREEN_BOTTOM_PADDING } from "@/constants/layout";
import { useAlbumList } from "@/hooks/usePhotoAlbums";
import type { PhotoAlbum } from "@/types/photo-album.types";
import { useRouter } from "expo-router";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  Text,
  View,
} from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { AlbumCard } from "./AlbumCard";

interface PetPhotosTabProps {
  petId: string;
  onScroll?: (event: any) => void;
  contentInsetTop?: number;
}

const COLUMNS = 2;
const SCREEN_WIDTH = Dimensions.get("window").width;

export function PetPhotosTab({
  petId,
  onScroll,
  contentInsetTop = 0,
}: PetPhotosTabProps): React.ReactElement {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const albumsQuery = useAlbumList(petId);

  const albums = albumsQuery.data?.pages.flatMap((page) => page.rows) ?? [];

  const tileSize = Math.floor(
    (SCREEN_WIDTH - theme.spacing.lg * 2 - theme.spacing.sm * (COLUMNS - 1)) /
      COLUMNS,
  );

  const navigateToAlbum = useCallback(
    (albumId: string) => {
      router.push(`/pets/${petId}/albums/${albumId}` as never);
    },
    [router, petId],
  );

  const navigateToCreate = useCallback(() => {
    router.push(`/pets/${petId}/albums/new` as never);
  }, [router, petId]);

  const renderItem = useCallback(
    ({ item }: { item: PhotoAlbum }) => (
      <AlbumCard
        album={item}
        size={tileSize}
        onPress={() => navigateToAlbum(item.id)}
      />
    ),
    [tileSize, navigateToAlbum],
  );

  if (albumsQuery.isPending) {
    return (
      <View style={[styles.centered, { paddingTop: contentInsetTop }]}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  if (albums.length === 0) {
    return (
      <View style={[styles.empty, { paddingTop: contentInsetTop }]}>
        <IconSymbol
          name="photo.on.rectangle"
          size={32}
          tintColor={theme.colors.textTertiary}
        />
        <Text style={[styles.emptyText, { color: theme.colors.textTertiary }]}>
          {t("photoAlbums.noAlbums")}
        </Text>
        <NorboPressable
          style={[styles.createBtn, { backgroundColor: theme.colors.primary }]}
          scale="row"
          haptic="medium"
          onPress={navigateToCreate}
        >
          <IconSymbol name="plus" size={16} tintColor="#fff" />
          <Text style={styles.createBtnText}>{t("photoAlbums.create")}</Text>
        </NorboPressable>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Animated.FlatList
        data={albums}
        keyExtractor={(item: PhotoAlbum) => item.id}
        numColumns={COLUMNS}
        columnWrapperStyle={styles.row}
        contentContainerStyle={[
          styles.grid,
          {
            paddingTop: contentInsetTop + theme.spacing.md,
            paddingBottom: SCREEN_BOTTOM_PADDING + insets.bottom,
          },
        ]}
        renderItem={renderItem as any}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onEndReached={() => {
          if (albumsQuery.hasNextPage && !albumsQuery.isFetchingNextPage) {
            void albumsQuery.fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={albumsQuery.isRefetching}
            onRefresh={() => void albumsQuery.refetch()}
            progressViewOffset={contentInsetTop}
          />
        }
      />

      <NorboPressable
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        haptic="medium"
        onPress={navigateToCreate}
      >
        <IconSymbol name="plus" size={22} tintColor="#fff" />
      </NorboPressable>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing["3xl"],
  },
  emptyText: {
    ...theme.typography.footnote,
    textAlign: "center",
  },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.pill,
    marginTop: theme.spacing.sm,
  },
  createBtnText: {
    ...theme.typography.subhead,
    color: "#fff",
    fontWeight: "600",
  },
  grid: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  row: {
    gap: theme.spacing.sm,
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
}));

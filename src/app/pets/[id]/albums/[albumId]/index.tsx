import { queryClient } from "@/app/_layout";
import { NorboPressable } from "@/components/CustomPressable";
import { PhotoGalleryViewer } from "@/components/pets/photos/PhotoGalleryViewer";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Screen } from "@/components/ui/Screen";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { SCREEN_BOTTOM_PADDING } from "@/constants/layout";
import {
  useAddPhotos,
  useAlbumDetail,
  useDeleteAlbum,
  useRemovePhoto,
  useSetCover,
} from "@/hooks/usePhotoAlbums";
import { mediaApi, uploadFileToR2 } from "@/services/media.api";
import type { MediaAsset } from "@/types/media.types";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Platform,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

const COLUMNS = 3;
const SCREEN_WIDTH = Dimensions.get("window").width;
const MAX_PHOTOS_PER_PICK = 20;

export default function AlbumDetailScreen(): React.JSX.Element {
  const { id: petId, albumId } = useLocalSearchParams<{
    id: string;
    albumId: string;
  }>();
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const albumQuery = useAlbumDetail(petId, albumId);
  const album = albumQuery.data;

  const addPhotosMutation = useAddPhotos(petId, albumId);
  const removePhotoMutation = useRemovePhoto(petId, albumId);
  const setCoverMutation = useSetCover(petId, albumId);
  const deleteAlbumMutation = useDeleteAlbum(petId);

  const [assetCache, setAssetCache] = useState<Record<string, MediaAsset>>({});
  const [pendingUploads, setPendingUploads] = useState<string[]>([]);
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);

  const assetIds = album?.mediaAssetIds ?? [];

  // Fetch asset metadata for all photos in the album
  useEffect(() => {
    const missing = assetIds.filter((id) => !assetCache[id]);
    if (missing.length === 0) return;
    let cancelled = false;
    void Promise.all(
      missing.map((id) =>
        mediaApi
          .getAsset(id)
          .then((r) => r.data)
          .catch(() => null),
      ),
    ).then((results) => {
      if (cancelled) return;
      setAssetCache((prev) => {
        const next = { ...prev };
        for (const asset of results) {
          if (asset) next[asset.id] = asset;
        }
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [assetIds, assetCache]);

  const tileSize = Math.floor(
    (SCREEN_WIDTH - theme.spacing.lg * 2 - theme.spacing.xs * (COLUMNS - 1)) /
      COLUMNS,
  );

  // Gallery images for the viewer
  const galleryImages = assetIds
    .map((id) => {
      const asset = assetCache[id];
      const uri = asset?.originalUrl ?? asset?.thumbMdUrl;
      return uri ? { uri } : null;
    })
    .filter(Boolean) as { uri: string }[];

  // Upload flow
  const pendingRef = useRef<string[]>([]);

  const pickAndUploadPhotos = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsMultipleSelection: true,
      selectionLimit: MAX_PHOTOS_PER_PICK,
      quality: 0.85,
    });
    if (result.canceled || result.assets.length === 0) return;

    const uploadedIds: string[] = [];

    for (const picked of result.assets) {
      const localKey = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setPendingUploads((prev) => [...prev, localKey]);
      pendingRef.current = [...pendingRef.current, localKey];

      try {
        const mimeType = picked.mimeType ?? "image/jpeg";
        const sizeBytes = picked.fileSize ?? 1;

        const { data: urlData } = await mediaApi.requestUploadUrl({
          context: "PET_PHOTO_ALBUM",
          contextRef: albumId,
          mimeType,
          sizeBytes,
        });

        await uploadFileToR2(urlData.uploadUrl, picked.uri, mimeType);
        const { data: asset } = await mediaApi.confirmUpload(urlData.assetId);

        setAssetCache((prev) => ({ ...prev, [asset.id]: asset }));
        uploadedIds.push(asset.id);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "upload failed";
        Alert.alert("Upload error", msg);
      } finally {
        pendingRef.current = pendingRef.current.filter((k) => k !== localKey);
        setPendingUploads((prev) => prev.filter((k) => k !== localKey));
      }
    }

    if (uploadedIds.length > 0) {
      addPhotosMutation.mutate({ mediaAssetIds: uploadedIds });
    }
  }, [albumId, addPhotosMutation]);

  // Action sheet for photo long-press
  const showPhotoActions = useCallback(
    (assetId: string) => {
      const options = [
        t("photoAlbums.setCover"),
        t("photoAlbums.removePhoto"),
        t("common.cancel"),
      ];

      const handler = (index: number) => {
        if (index === 0) {
          setCoverMutation.mutate({ mediaAssetId: assetId });
        } else if (index === 1) {
          removePhotoMutation.mutate(assetId);
        }
      };

      if (Platform.OS === "ios") {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options,
            destructiveButtonIndex: 1,
            cancelButtonIndex: 2,
          },
          handler,
        );
      } else {
        Alert.alert(undefined, undefined, [
          { text: options[0], onPress: () => handler(0) },
          {
            text: options[1],
            style: "destructive",
            onPress: () => handler(1),
          },
          { text: options[2], style: "cancel" },
        ]);
      }
    },
    [t, setCoverMutation, removePhotoMutation],
  );

  // Delete album
  const confirmDelete = useCallback(() => {
    Alert.alert(
      t("photoAlbums.deleteConfirmTitle"),
      t("photoAlbums.deleteConfirmMessage"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("photoAlbums.deleteConfirmOk"),
          style: "destructive",
          onPress: () => {
            deleteAlbumMutation.mutate(albumId, {
              onSuccess: () => {
                void queryClient.invalidateQueries({
                  queryKey: ["photo-albums", petId],
                });
                router.back();
              },
            });
          },
        },
      ],
    );
  }, [t, deleteAlbumMutation, albumId, petId, router]);

  const navigateToEdit = useCallback(() => {
    router.push(`/pets/${petId}/albums/${albumId}/edit` as never);
  }, [router, petId, albumId]);

  const renderItem = useCallback(
    ({ item, index }: { item: string; index: number }) => {
      const asset = assetCache[item];
      const uri =
        asset?.thumbMdUrl ?? asset?.thumbSmUrl ?? asset?.originalUrl;
      const isCover = album?.coverAssetId === item;

      return (
        <NorboPressable
          style={[
            styles.photoTile,
            { width: tileSize, height: tileSize },
          ]}
          scale="row"
          haptic="light"
          onPress={() => setGalleryIndex(index)}
          onLongPress={() => showPhotoActions(item)}
        >
          {uri ? (
            <Image
              source={{ uri }}
              style={{ width: tileSize, height: tileSize }}
              contentFit="cover"
            />
          ) : (
            <View
              style={[
                styles.photoPlaceholder,
                { backgroundColor: theme.colors.backgroundSecondary },
              ]}
            >
              <ActivityIndicator color={theme.colors.primary} />
            </View>
          )}
          {isCover && (
            <View
              style={[
                styles.coverBadge,
                { backgroundColor: theme.colors.scrim },
              ]}
            >
              <IconSymbol name="star.fill" size={10} tintColor="#fff" />
            </View>
          )}
        </NorboPressable>
      );
    },
    [assetCache, album?.coverAssetId, tileSize, showPhotoActions, theme],
  );

  // Header right actions
  const headerRight = (
    <View style={styles.headerActions}>
      <NorboPressable
        style={styles.headerBtn}
        scale="row"
        haptic="light"
        onPress={navigateToEdit}
      >
        <IconSymbol
          name="pencil"
          size={18}
          tintColor={theme.colors.primary}
        />
      </NorboPressable>
      <NorboPressable
        style={styles.headerBtn}
        scale="row"
        haptic="light"
        onPress={confirmDelete}
      >
        <IconSymbol
          name="trash"
          size={18}
          tintColor={theme.colors.error}
        />
      </NorboPressable>
    </View>
  );

  if (albumQuery.isPending) {
    return (
      <Screen>
        <ScreenHeader title="" />
        <View style={styles.centered}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      </Screen>
    );
  }

  if (!album) {
    return (
      <Screen>
        <ScreenHeader title="" />
        <View style={styles.centered}>
          <Text style={{ color: theme.colors.textSecondary }}>
            Album not found
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader title={album.title} right={headerRight} />

      {assetIds.length === 0 && pendingUploads.length === 0 ? (
        <View style={styles.empty}>
          <IconSymbol
            name="photo.on.rectangle"
            size={32}
            tintColor={theme.colors.textTertiary}
          />
          <Text
            style={[styles.emptyText, { color: theme.colors.textTertiary }]}
          >
            {t("photoAlbums.emptyAlbum")}
          </Text>
          <Text
            style={[
              styles.emptySubtext,
              { color: theme.colors.textTertiary },
            ]}
          >
            {t("photoAlbums.emptyAlbumSubtitle")}
          </Text>
          <NorboPressable
            style={[
              styles.addBtn,
              { backgroundColor: theme.colors.primary },
            ]}
            scale="row"
            haptic="medium"
            onPress={() => void pickAndUploadPhotos()}
          >
            <IconSymbol name="plus" size={16} tintColor="#fff" />
            <Text style={styles.addBtnText}>
              {t("photoAlbums.addPhotos")}
            </Text>
          </NorboPressable>
        </View>
      ) : (
        <>
          {album.description ? (
            <Text
              style={[
                styles.description,
                { color: theme.colors.textSecondary },
              ]}
            >
              {album.description}
            </Text>
          ) : null}

          <FlatList
            data={[...assetIds, ...pendingUploads.map((k) => `pending:${k}`)]}
            keyExtractor={(item) => item}
            numColumns={COLUMNS}
            columnWrapperStyle={styles.row}
            contentContainerStyle={[
              styles.grid,
              { paddingBottom: SCREEN_BOTTOM_PADDING + insets.bottom + 80 },
            ]}
            renderItem={({ item, index }) => {
              if (item.startsWith("pending:")) {
                return (
                  <View
                    style={[
                      styles.photoTile,
                      {
                        width: tileSize,
                        height: tileSize,
                        backgroundColor: theme.colors.backgroundSecondary,
                      },
                    ]}
                  >
                    <ActivityIndicator color={theme.colors.primary} />
                  </View>
                );
              }
              return renderItem({ item, index });
            }}
            ListHeaderComponent={
              <NorboPressable
                style={[
                  styles.addPhotosHeader,
                  { borderColor: theme.colors.border },
                ]}
                scale="row"
                haptic="light"
                onPress={() => void pickAndUploadPhotos()}
              >
                <IconSymbol
                  name="plus"
                  size={16}
                  tintColor={theme.colors.primary}
                />
                <Text
                  style={[
                    styles.addPhotosText,
                    { color: theme.colors.primary },
                  ]}
                >
                  {t("photoAlbums.addPhotos")}
                </Text>
              </NorboPressable>
            }
          />
        </>
      )}

      <PhotoGalleryViewer
        images={galleryImages}
        visible={galleryIndex !== null}
        initialIndex={galleryIndex ?? 0}
        onClose={() => setGalleryIndex(null)}
        onSetCover={(index) => {
          const assetId = assetIds[index];
          if (assetId) setCoverMutation.mutate({ mediaAssetId: assetId });
        }}
        onRemove={(index) => {
          const assetId = assetIds[index];
          if (assetId) removePhotoMutation.mutate(assetId);
          setGalleryIndex(null);
        }}
        coverAssetId={album.coverAssetId}
        assetIds={assetIds}
      />
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
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
    ...theme.typography.subhead,
    fontWeight: "600",
    textAlign: "center",
  },
  emptySubtext: {
    ...theme.typography.footnote,
    textAlign: "center",
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.pill,
    marginTop: theme.spacing.sm,
  },
  addBtnText: {
    ...theme.typography.subhead,
    color: "#fff",
    fontWeight: "600",
  },
  description: {
    ...theme.typography.footnote,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
  },
  grid: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
  },
  row: {
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  photoTile: {
    borderRadius: theme.radius.sm,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  photoPlaceholder: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  coverBadge: {
    position: "absolute",
    top: 4,
    left: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  addPhotosHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.md,
    borderWidth: theme.hairline,
    borderRadius: theme.radius.lg,
    borderStyle: "dashed",
    marginBottom: theme.spacing.md,
  },
  addPhotosText: {
    ...theme.typography.subhead,
    fontWeight: "600",
  },
  headerActions: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
}));

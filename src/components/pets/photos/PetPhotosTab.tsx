import { NorboPressable } from "@/components/CustomPressable";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { SCREEN_BOTTOM_PADDING } from "@/constants/layout";
import { mediaApi } from "@/services/media.api";
import { petEventsApi } from "@/services/pet-events.api";
import type { MediaAsset } from "@/types/media.types";
import type { PetEvent, PetEventTimeline } from "@/types/pet-event.types";
import { useInfiniteQuery, useQueries } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

interface PetPhotosTabProps {
  petId: string;
}

interface PhotoTile {
  assetId: string;
  eventId: string;
}

const COLUMNS = 3;
const SCREEN_WIDTH = Dimensions.get("window").width;

/**
 * PetPhotosTab — aggregated gallery of every media asset attached to
 * any PetEvent of this pet.
 *
 * Implementation: paginated timeline query (same key as PetTimeline so
 * cache is shared) → flatMap `mediaAssetIds` → fetch each `MediaAsset`
 * via parallel `useQueries`. Tapping a tile opens the parent event.
 *
 * MVP: shows raster thumbnails. PDFs render a generic doc tile. When a
 * dedicated `?hasMedia=true` filter lands on the backend, swap the
 * query implementation without touching the tab.
 */
export function PetPhotosTab({ petId }: PetPhotosTabProps): React.ReactElement {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const timeline = useInfiniteQuery({
    queryKey: ["pet-events", petId],
    queryFn: ({ pageParam }) =>
      petEventsApi
        .list(petId, { cursor: pageParam as string | undefined, limit: 20 })
        .then((r) => r.data),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last: PetEventTimeline) => last.nextCursor ?? undefined,
    enabled: !!petId,
  });

  // Flatten every event with attachments and keep the event ↔ asset link.
  const tiles = useMemo<PhotoTile[]>(() => {
    if (!timeline.data) return [];
    const out: PhotoTile[] = [];
    for (const page of timeline.data.pages) {
      const all: PetEvent[] = [...page.past, ...page.upcoming];
      for (const event of all) {
        for (const assetId of event.mediaAssetIds) {
          out.push({ assetId, eventId: event.id });
        }
      }
    }
    return out;
  }, [timeline.data]);

  // Fetch every MediaAsset in parallel. Each query is keyed by assetId
  // so it is shared with any other view that needs the same asset.
  const assetQueries = useQueries({
    queries: tiles.map(({ assetId }) => ({
      queryKey: ["media", assetId],
      queryFn: () => mediaApi.getAsset(assetId).then((r) => r.data),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const tileSize = Math.floor(
    (SCREEN_WIDTH - theme.spacing.lg * 2 - theme.spacing.xs * (COLUMNS - 1)) /
      COLUMNS,
  );

  if (timeline.isPending) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  if (tiles.length === 0) {
    return (
      <View style={styles.empty}>
        <IconSymbol
          name="photo"
          size={32}
          tintColor={theme.colors.textTertiary}
        />
        <Text style={[styles.emptyText, { color: theme.colors.textTertiary }]}>
          {t("petDetail.photos.empty")}
        </Text>
      </View>
    );
  }

  return (
    <FlatList<PhotoTile>
      data={tiles}
      keyExtractor={(item) => item.assetId}
      numColumns={COLUMNS}
      columnWrapperStyle={styles.row}
      contentContainerStyle={[
        styles.grid,
        { paddingBottom: SCREEN_BOTTOM_PADDING + insets.bottom },
      ]}
      renderItem={({ item, index }) => {
        const asset: MediaAsset | undefined = assetQueries[index]?.data;
        const isPdf = asset?.mimeType === "application/pdf";
        const uri = asset?.thumbSmUrl ?? asset?.thumbMdUrl ?? asset?.originalUrl;
        return (
          <NorboPressable
            style={[
              styles.tile,
              {
                width: tileSize,
                height: tileSize,
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
            scale="row"
            haptic="light"
            onPress={() =>
              router.push(
                `/pets/${petId}/events/${item.eventId}` as never,
              )
            }
          >
            {isPdf ? (
              <View style={styles.pdfTile}>
                <IconSymbol
                  name="doc.fill"
                  size={28}
                  tintColor={theme.colors.primary}
                />
                <Text
                  style={[
                    styles.pdfLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  PDF
                </Text>
              </View>
            ) : uri ? (
              <Image
                source={{ uri }}
                style={{ width: tileSize, height: tileSize }}
                contentFit="cover"
              />
            ) : (
              <ActivityIndicator color={theme.colors.primary} />
            )}
          </NorboPressable>
        );
      }}
    />
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
    ...theme.typography.footnote,
    textAlign: "center",
  },
  grid: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  row: {
    gap: theme.spacing.xs,
  },
  tile: {
    borderRadius: theme.radius.md,
    borderWidth: theme.hairline,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  pdfTile: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  pdfLabel: {
    ...theme.typography.caption,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
}));

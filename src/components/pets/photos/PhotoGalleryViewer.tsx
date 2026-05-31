import { NorboPressable } from "@/components/CustomPressable";
import { IconSymbol } from "@/components/ui/IconSymbol";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import ImageViewing from "react-native-image-viewing";

interface PhotoGalleryViewerProps {
  images: { uri: string }[];
  visible: boolean;
  initialIndex: number;
  onClose: () => void;
  onSetCover?: (index: number) => void;
  onRemove?: (index: number) => void;
  coverAssetId?: string | null;
  assetIds?: string[];
}

export function PhotoGalleryViewer({
  images,
  visible,
  initialIndex,
  onClose,
  onSetCover,
  onRemove,
  coverAssetId,
  assetIds = [],
}: PhotoGalleryViewerProps): React.ReactElement {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const insets = useSafeAreaInsets();

  const renderFooter = useCallback(
    ({ imageIndex }: { imageIndex: number }) => {
      const isCover = assetIds[imageIndex] === coverAssetId;

      return (
        <View
          style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}
        >
          {onSetCover && (
            <NorboPressable
              style={[
                styles.actionBtn,
                isCover && styles.actionBtnActive,
              ]}
              scale="row"
              haptic="light"
              onPress={() => onSetCover(imageIndex)}
              disabled={isCover}
            >
              <IconSymbol
                name="star.fill"
                size={16}
                tintColor={isCover ? "#FFD700" : "#fff"}
              />
              <Text style={styles.actionText}>
                {t("photoAlbums.setCover")}
              </Text>
            </NorboPressable>
          )}
          {onRemove && (
            <NorboPressable
              style={styles.actionBtn}
              scale="row"
              haptic="medium"
              onPress={() => onRemove(imageIndex)}
            >
              <IconSymbol name="trash" size={16} tintColor="#FF6B6B" />
              <Text style={[styles.actionText, { color: "#FF6B6B" }]}>
                {t("photoAlbums.removePhoto")}
              </Text>
            </NorboPressable>
          )}
        </View>
      );
    },
    [assetIds, coverAssetId, insets.bottom, onRemove, onSetCover, t],
  );

  return (
    <ImageViewing
      images={images}
      imageIndex={initialIndex}
      visible={visible}
      onRequestClose={onClose}
      swipeToCloseEnabled
      doubleTapToZoomEnabled
      FooterComponent={renderFooter}
    />
  );
}

const styles = StyleSheet.create((theme) => ({
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.pill,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  actionBtnActive: {
    opacity: 0.6,
  },
  actionText: {
    ...theme.typography.footnote,
    color: "#fff",
    fontWeight: "600",
  },
}));

import { NorboPressable } from "@/components/CustomPressable";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { mediaApi, uploadFileToR2 } from "@/services/media.api";
import type { MediaAsset } from "@/types/media.types";
import * as DocumentPicker from "expo-document-picker";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

export const MAX_ATTACHMENTS = 5;

interface AttachmentSectionProps {
  value: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}

interface PendingUpload {
  localKey: string;
  kind: "image" | "pdf";
}

/**
 * AttachmentSection — controlled multi-attachment picker for pet event
 * forms. Supports up to `MAX_ATTACHMENTS` items, mixed images (JPEG /
 * PNG / HEIC / WebP) and PDFs (insurance policies, vet receipts, etc.).
 *
 * Uses the existing presigned-PUT upload pipeline (`mediaApi` +
 * `uploadFileToR2`) with `PET_EVENT_MEDIA` context. The component is
 * controlled: it surfaces confirmed asset IDs through `onChange`; the
 * parent form persists them on submit via `mediaAssetIds` on the
 * PetEvent create/update payload.
 *
 * Removal does NOT call the delete endpoint — orphaned assets are
 * pruned by `cleanup-user-media` cron on the backend.
 */
export function AttachmentSection({
  value,
  onChange,
  disabled = false,
}: AttachmentSectionProps) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();

  // Cache of resolved metadata so we can render PDF labels and image
  // thumbnails without holding the parent responsible.
  const [assetCache, setAssetCache] = useState<Record<string, MediaAsset>>({});
  const [pending, setPending] = useState<PendingUpload[]>([]);

  // Keep latest `value` reachable inside concurrent upload promises so each
  // resolution appends to the most recent list instead of overwriting it.
  const valueRef = useRef<string[]>(value);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    const missing = value.filter((id) => !assetCache[id]);
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
  }, [value, assetCache]);

  const slotsLeft = MAX_ATTACHMENTS - value.length - pending.length;
  const canAdd = !disabled && slotsLeft > 0;

  const upload = useCallback(
    async (
      uri: string,
      mimeType: string,
      sizeBytes: number,
      kind: "image" | "pdf",
    ) => {
      const localKey = `${Date.now().toString()}-${Math.random().toString(36).slice(2, 8)}`;
      setPending((prev) => [...prev, { localKey, kind }]);
      try {
        const { data: urlData } = await mediaApi.requestUploadUrl({
          context: "PET_EVENT_MEDIA",
          mimeType,
          sizeBytes,
        });
        await uploadFileToR2(urlData.uploadUrl, uri, mimeType);
        const { data: asset } = await mediaApi.confirmUpload(urlData.assetId);
        setAssetCache((prev) => ({ ...prev, [asset.id]: asset }));
        // Sync-update the ref BEFORE calling onChange so any concurrent
        // upload that resolves on the same tick reads the appended list
        // instead of the stale pre-render value.
        const nextIds = [...valueRef.current, asset.id];
        valueRef.current = nextIds;
        onChange(nextIds);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "upload failed";
        Alert.alert(t("attachments.errorTitle"), msg);
      } finally {
        setPending((prev) => prev.filter((p) => p.localKey !== localKey));
      }
    },
    [onChange, t],
  );

  const pickImages = useCallback(async () => {
    const slots = MAX_ATTACHMENTS - value.length - pending.length;
    if (slots <= 0) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsMultipleSelection: true,
      selectionLimit: slots,
      quality: 0.85,
    });
    if (result.canceled) return;
    for (const picked of result.assets) {
      const mimeType = picked.mimeType ?? "image/jpeg";
      const sizeBytes = picked.fileSize ?? 1;
      void upload(picked.uri, mimeType, sizeBytes, "image");
    }
  }, [pending.length, upload, value.length]);

  const pickPdf = useCallback(async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/pdf",
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled) return;
    const picked = result.assets[0];
    if (!picked) return;
    const mimeType = picked.mimeType ?? "application/pdf";
    const sizeBytes = picked.size ?? 1;
    void upload(picked.uri, mimeType, sizeBytes, "pdf");
  }, [upload]);

  const presentPicker = useCallback(() => {
    if (!canAdd) return;
    const labels = {
      image: t("attachments.pickImage"),
      pdf: t("attachments.pickPdf"),
      cancel: t("common.cancel"),
    };
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [labels.image, labels.pdf, labels.cancel],
          cancelButtonIndex: 2,
        },
        (index) => {
          if (index === 0) void pickImages();
          else if (index === 1) void pickPdf();
        },
      );
    } else {
      Alert.alert(t("attachments.addTitle"), undefined, [
        { text: labels.image, onPress: () => void pickImages() },
        { text: labels.pdf, onPress: () => void pickPdf() },
        { text: labels.cancel, style: "cancel" },
      ]);
    }
  }, [canAdd, pickImages, pickPdf, t]);

  const removeAt = useCallback(
    (assetId: string) => {
      Alert.alert(
        t("attachments.removeTitle"),
        t("attachments.removeMessage"),
        [
          { text: t("common.cancel"), style: "cancel" },
          {
            text: t("attachments.removeConfirm"),
            style: "destructive",
            onPress: () => onChange(value.filter((id) => id !== assetId)),
          },
        ],
      );
    },
    [onChange, t, value],
  );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.strip}
    >
      {value.map((assetId) => {
        const asset = assetCache[assetId];
        const isPdf = asset?.mimeType === "application/pdf";
        return (
          <NorboPressable
            key={assetId}
            style={[
              styles.tile,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
            scale="row"
            haptic="light"
            onLongPress={() => removeAt(assetId)}
          >
            {isPdf ? (
              <View style={styles.pdfInner}>
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
                  numberOfLines={1}
                >
                  PDF
                </Text>
              </View>
            ) : asset?.thumbSmUrl || asset?.thumbMdUrl || asset?.originalUrl ? (
              <Image
                source={{
                  uri:
                    asset.thumbSmUrl ??
                    asset.thumbMdUrl ??
                    asset.originalUrl ??
                    "",
                }}
                style={styles.tileImage}
                contentFit="cover"
              />
            ) : (
              <View style={styles.tileImage}>
                <ActivityIndicator color={theme.colors.primary} />
              </View>
            )}
            <NorboPressable
              style={styles.removeBadge}
              scale="row"
              haptic="light"
              onPress={() => removeAt(assetId)}
            >
              <IconSymbol name="xmark" size={12} tintColor="#fff" />
            </NorboPressable>
          </NorboPressable>
        );
      })}

      {pending.map((p) => (
        <View
          key={p.localKey}
          style={[
            styles.tile,
            styles.tilePending,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      ))}

      {canAdd ? (
        <NorboPressable
          style={[
            styles.tile,
            styles.tileAdd,
            { borderColor: theme.colors.border },
          ]}
          scale="row"
          haptic="medium"
          onPress={presentPicker}
        >
          <IconSymbol
            name="plus"
            size={24}
            tintColor={theme.colors.textSecondary}
          />
          <Text
            style={[styles.addLabel, { color: theme.colors.textSecondary }]}
          >
            {t("attachments.add")}
          </Text>
        </NorboPressable>
      ) : null}
    </ScrollView>
  );
}

const TILE = 84;

const styles = StyleSheet.create((theme) => ({
  strip: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  tile: {
    width: TILE,
    height: TILE,
    borderRadius: theme.radius.md,
    borderWidth: theme.hairline,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  tilePending: {
    opacity: 0.7,
  },
  tileAdd: {
    borderStyle: "dashed",
    gap: 4,
  },
  addLabel: {
    ...theme.typography.caption,
    fontWeight: "600",
  },
  tileImage: {
    width: TILE,
    height: TILE,
    alignItems: "center",
    justifyContent: "center",
  },
  pdfInner: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  pdfLabel: {
    ...theme.typography.caption,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  removeBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
  },
}));

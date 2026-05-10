import React from "react";
import { ActivityIndicator, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import Animated, { useAnimatedStyle, withSpring } from "react-native-reanimated";
import { NorboPressable } from "@/components/CustomPressable";
import { Avatar } from "@/components/ui/Avatar";
import { useMediaUpload } from "@/hooks/useMediaUpload";
import type { MediaAsset } from "@/types/media.types";

interface AvatarUploaderProps {
  name: string | null | undefined;
  currentUrl: string | null | undefined;
  onUploaded: (asset: MediaAsset) => void;
  size?: "md" | "lg" | "xl";
}

/**
 * AvatarUploader — avatar circle with a tap-to-edit overlay.
 *
 * Tapping opens the image picker, compresses, uploads to R2, confirms,
 * and calls `onUploaded` with the confirmed MediaAsset. Shows an
 * ActivityIndicator during upload and a progress bar at the bottom.
 */
export function AvatarUploader({
  name,
  currentUrl,
  onUploaded,
  size = "xl",
}: AvatarUploaderProps) {
  const { theme } = useUnistyles();
  const { state, progress, asset, pickAndUpload } = useMediaUpload();

  const isUploading = state === "uploading" || state === "confirming" || state === "picking";

  const displayUrl = asset?.thumbMdUrl ?? asset?.originalUrl ?? currentUrl;

  const handlePress = async () => {
    if (isUploading) return;
    const uploaded = await pickAndUpload("USER_AVATAR");
    if (uploaded) {
      onUploaded(uploaded);
    }
  };

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${(progress * 100).toFixed(0)}%` as `${number}%`,
  }));

  const dimension = theme.avatarSize[size];

  return (
    <NorboPressable
      onPress={() => void handlePress()}
      disabled={isUploading}
      haptic="medium"
      style={styles.container}
    >
      <View style={{ width: dimension, height: dimension }}>
        <Avatar name={name} source={displayUrl} size={size} />

        {isUploading && (
          <View style={[styles.overlay, { borderRadius: dimension / 2 }]}>
            <ActivityIndicator color={theme.colors.textOnPrimary} />
          </View>
        )}

        {!isUploading && (
          <View style={[styles.editBadge, { borderRadius: dimension / 2 }]}>
            <View style={styles.editDot} />
          </View>
        )}
      </View>

      {state === "uploading" && (
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              progressBarStyle,
              { backgroundColor: theme.colors.primary },
            ]}
          />
        </View>
      )}
    </NorboPressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: theme.colors.primary,
    borderWidth: 2,
    borderColor: theme.colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  editDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.textOnPrimary,
  },
  progressTrack: {
    width: 80,
    height: 3,
    borderRadius: 2,
    backgroundColor: theme.colors.border2,
    overflow: "hidden",
  },
  progressFill: {
    height: 3,
    borderRadius: 2,
  },
}));

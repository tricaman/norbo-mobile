import { NorboPressable } from "@/components/CustomPressable";
import {
  fallbackKindLabel,
  getKindMeta,
} from "@/components/tools/places/kind-meta";
import { usePlace } from "@/hooks/usePlaces";
import type { PlaceDetail } from "@/types/place.types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Linking,
  Modal,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

interface PlaceDetailSheetProps {
  placeId: string | null;
  onClose: () => void;
}

function openInMaps(place: PlaceDetail) {
  const label = encodeURIComponent(place.name ?? "");
  const url =
    Platform.OS === "ios"
      ? `maps://?ll=${place.lat},${place.lng}&q=${label || "%20"}`
      : `geo:${place.lat},${place.lng}?q=${place.lat},${place.lng}(${label})`;
  void Linking.openURL(url);
}

function AmenityChip({ label }: { label: string }) {
  return (
    <View style={styles.amenityChip}>
      <Text style={styles.amenityLabel}>{label}</Text>
    </View>
  );
}

/**
 * Bottom-anchored place detail, rendered inline as a transparent Modal —
 * the SingleSelectSheet pattern. Deliberately NO router.push: the tool must
 * stay pure, so the selected place lives in the tool's state and this sheet
 * renders from it.
 */
export function PlaceDetailSheet({ placeId, onClose }: PlaceDetailSheetProps) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const { data: place, isPending } = usePlace(placeId);

  const amenities: string[] = [];
  if (place) {
    if (place.fenced === true)
      amenities.push(t("tools.places.detail.fenced"));
    if (place.offLeash === true)
      amenities.push(t("tools.places.detail.offLeash"));
    if (place.hasWater === true)
      amenities.push(t("tools.places.detail.water"));
    if (place.lit === true)
      amenities.push(t("tools.places.detail.lit"));
    if (place.surface)
      amenities.push(
        `${t("tools.places.detail.surface")}: ${place.surface}`,
      );
    if (place.dogAccess === "leashed" || place.dogAccess === "outside")
      amenities.push(
        t(`tools.places.detail.dogAccess.${place.dogAccess}`),
      );
    if (place.lengthKm != null)
      amenities.push(`${place.lengthKm} km`);
  }

  // Version-skew safe: unknown kinds fall back to a readable string.
  const kindMeta = place ? getKindMeta(place.kind) : null;
  const kindLabel = kindMeta?.labelKey
    ? t(kindMeta.labelKey as never)
    : place
      ? fallbackKindLabel(place.kind)
      : "";

  const address = place
    ? [
        [place.street, place.housenumber].filter(Boolean).join(" "),
        [place.postcode, place.city].filter(Boolean).join(" "),
      ]
        .filter((part) => part.length > 0)
        .join(", ")
    : "";

  return (
    <Modal
      visible={placeId !== null}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      {/* gesture-handler pressables need their own root inside a Modal */}
      <GestureHandlerRootView style={styles.backdrop}>
        <Pressable style={styles.backdropTap} onPress={onClose} />
        <View style={styles.sheet}>
          {isPending || !place ? (
            <View style={styles.loading}>
              <ActivityIndicator color={theme.colors.primary} />
            </View>
          ) : (
            <>
              <View style={styles.header}>
                <View style={styles.kindIcon}>
                  <MaterialCommunityIcons
                    name={
                      getKindMeta(place.kind).icon as React.ComponentProps<
                        typeof MaterialCommunityIcons
                      >["name"]
                    }
                    size={20}
                    color={theme.colors.primary}
                  />
                </View>
                <View style={styles.headerText}>
                  <Text style={styles.title} numberOfLines={2}>
                    {place.name ?? kindLabel}
                  </Text>
                  <Text style={styles.subtitle} numberOfLines={1}>
                    {kindLabel}
                    {address ? ` · ${address}` : ""}
                  </Text>
                </View>
              </View>

              {amenities.length > 0 ? (
                <View style={styles.amenities}>
                  {amenities.map((a) => (
                    <AmenityChip key={a} label={a} />
                  ))}
                </View>
              ) : null}

              {place.openingHours ? (
                <Text style={styles.meta}>
                  {t("tools.places.detail.openingHours")}:{" "}
                  {place.openingHours}
                </Text>
              ) : null}
              {place.phone ? (
                <Text style={styles.meta}>{place.phone}</Text>
              ) : null}

              <View style={styles.actions}>
                <NorboPressable
                  haptic="light"
                  scale="cta"
                  style={[styles.action, styles.actionPrimary]}
                  onPress={() => openInMaps(place)}
                >
                  <MaterialCommunityIcons
                    name="map"
                    size={16}
                    color={theme.colors.textOnPrimary}
                  />
                  <Text style={styles.actionPrimaryLabel}>
                    {t("tools.places.actions.openInMaps")}
                  </Text>
                </NorboPressable>
                {place.website ? (
                  <NorboPressable
                    haptic="light"
                    scale="cta"
                    style={styles.action}
                    onPress={() => void Linking.openURL(place.website as string)}
                  >
                    <MaterialCommunityIcons
                      name="web"
                      size={16}
                      color={theme.colors.textSecondary}
                    />
                    <Text style={styles.actionLabel}>
                      {t("tools.places.detail.website")}
                    </Text>
                  </NorboPressable>
                ) : null}
                {place.osmUrl ? (
                  <NorboPressable
                    haptic="light"
                    scale="cta"
                    style={styles.action}
                    onPress={() => void Linking.openURL(place.osmUrl as string)}
                  >
                    <MaterialCommunityIcons
                      name="flag-outline"
                      size={16}
                      color={theme.colors.textSecondary}
                    />
                    <Text style={styles.actionLabel}>
                      {t("tools.places.actions.reportIssue")}
                    </Text>
                  </NorboPressable>
                ) : null}
              </View>

              <Text style={styles.disclaimer}>
                {t("tools.places.dataDisclaimer")}
              </Text>
            </>
          )}
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create((theme) => ({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: theme.colors.scrimInverse,
  },
  backdropTap: { flex: 1 },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing["3xl"],
    gap: theme.spacing.md,
  },
  loading: {
    paddingVertical: theme.spacing["3xl"],
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  kindIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: { flex: 1, gap: 2 },
  title: {
    ...theme.typography.title2,
    color: theme.colors.textPrimary,
  },
  subtitle: {
    ...theme.typography.footnote,
    color: theme.colors.textSecondary,
  },
  amenities: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
  },
  amenityChip: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface2,
    borderWidth: theme.hairline,
    borderColor: theme.colors.border,
  },
  amenityLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  meta: {
    ...theme.typography.footnote,
    color: theme.colors.textSecondary,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface2,
    borderWidth: theme.hairline,
    borderColor: theme.colors.border,
  },
  actionPrimary: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  actionPrimaryLabel: {
    ...theme.typography.footnote,
    fontWeight: "600",
    color: theme.colors.textOnPrimary,
  },
  actionLabel: {
    ...theme.typography.footnote,
    color: theme.colors.textSecondary,
  },
  disclaimer: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
  },
}));

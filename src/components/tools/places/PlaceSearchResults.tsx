import { NorboPressable } from "@/components/CustomPressable";
import { getKindMeta } from "@/components/tools/places/kind-meta";
import type {
  CitySearchHit,
  GeocodeResult,
  PlaceSearchHit,
} from "@/types/place.types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

/** What the map needs to jump somewhere — the only thing a pick returns. */
export interface SearchTarget {
  lat: number;
  lng: number;
  spanDeg: number;
}

interface PlaceSearchResultsProps {
  cities: CitySearchHit[];
  places: PlaceSearchHit[];
  addresses: GeocodeResult[];
  status: "idle" | "loading" | "done" | "degraded";
  onPick: (target: SearchTarget) => void;
}

interface RowProps {
  icon: string;
  title: string;
  subtitle?: string | null;
  onPress: () => void;
}

function Row({ icon, title, subtitle, onPress }: RowProps) {
  const { theme } = useUnistyles();
  return (
    <NorboPressable haptic="light" scale="row" onPress={onPress}>
      <View style={styles.row}>
        <MaterialCommunityIcons
          name={
            icon as React.ComponentProps<typeof MaterialCommunityIcons>["name"]
          }
          size={18}
          color={theme.colors.textTertiary}
        />
        <View style={styles.rowText}>
          <Text style={styles.rowTitle} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.rowSubtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
    </NorboPressable>
  );
}

/**
 * Search dropdown: our own data first (cities, then places), addresses last.
 *
 * Two sections rather than three — cities and places are both "our data" and
 * read naturally together, while a third header in a 280pt panel is noise.
 * `maxHeight` is what keeps the panel from growing down into the map's
 * bottom ornaments (the Apple logo and "Legal" link on iOS, which Apple
 * forbids covering).
 */
export function PlaceSearchResults({
  cities,
  places,
  addresses,
  status,
  onPick,
}: PlaceSearchResultsProps) {
  const { t } = useTranslation();

  const hasOurs = cities.length > 0 || places.length > 0;
  const hasAny = hasOurs || addresses.length > 0;

  if (status === "loading" && !hasAny) return null;

  return (
    <View style={styles.panel}>
      <ScrollView keyboardShouldPersistTaps="handled" bounces={false}>
        {hasOurs ? (
          <>
            <Text style={styles.section}>
              {t("tools.places.search.sectionPlaces")}
            </Text>
            {cities.map((c) => (
              <Row
                key={`c-${c.city}`}
                icon="city-variant-outline"
                title={c.city}
                subtitle={t("tools.places.search.cityCount", {
                  count: c.count,
                })}
                onPress={() =>
                  onPick({ lat: c.lat, lng: c.lng, spanDeg: c.spanDeg })
                }
              />
            ))}
            {places.map((p) => (
              <Row
                key={p.id}
                icon={getKindMeta(p.kind).icon}
                title={p.name}
                subtitle={p.city}
                onPress={() =>
                  onPick({ lat: p.lat, lng: p.lng, spanDeg: p.spanDeg })
                }
              />
            ))}
          </>
        ) : null}

        {addresses.length > 0 ? (
          <>
            <Text style={styles.section}>
              {t("tools.places.search.sectionAddresses")}
            </Text>
            {addresses.map((a) => (
              <Row
                key={`${a.lat},${a.lng},${a.formattedAddress}`}
                icon="map-marker-outline"
                title={a.formattedAddress}
                onPress={() =>
                  onPick({ lat: a.lat, lng: a.lng, spanDeg: a.spanDeg })
                }
              />
            ))}
          </>
        ) : null}

        {status === "degraded" ? (
          <Text style={styles.note}>{t("tools.places.search.degraded")}</Text>
        ) : null}

        {status !== "loading" && !hasAny ? (
          <Text style={styles.note}>{t("tools.places.search.empty")}</Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  panel: {
    maxHeight: 280,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: theme.hairline,
    borderColor: theme.colors.border,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  section: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.xs,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  rowText: { flex: 1 },
  rowTitle: {
    ...theme.typography.subhead,
    color: theme.colors.textPrimary,
  },
  rowSubtitle: {
    ...theme.typography.footnote,
    color: theme.colors.textSecondary,
  },
  note: {
    ...theme.typography.footnote,
    color: theme.colors.textTertiary,
    padding: theme.spacing.md,
  },
}));

import { NorboPressable } from "@/components/CustomPressable";
import { AddPlaceSheet } from "@/components/tools/places/AddPlaceSheet";
import { ClusterMarker } from "@/components/tools/places/ClusterMarker";
import { PlaceDetailSheet } from "@/components/tools/places/PlaceDetailSheet";
import { PlaceKindFilterBar } from "@/components/tools/places/PlaceKindFilterBar";
import { PlaceMarker } from "@/components/tools/places/PlaceMarker";
import { PlaceSearchBar } from "@/components/tools/places/PlaceSearchBar";
import {
  PlaceSearchResults,
  type SearchTarget,
} from "@/components/tools/places/PlaceSearchResults";
import { useAddressSearch } from "@/components/tools/places/useAddressSearch";
import { useClusters } from "@/components/tools/places/useClusters";
import { useDebouncedRegion } from "@/components/tools/places/useDebouncedRegion";
import { useUserLocation } from "@/components/tools/places/useUserLocation";
import { useDebounce } from "@/hooks/useDebounce";
import {
  isRegionTooWide,
  usePlace,
  usePlacesNearby,
  type MapRegion,
} from "@/hooks/usePlaces";
import type { PlaceKind } from "@/types/place.types";
import { toast } from "@/utils/toast";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { Alert, Keyboard, Linking, Platform, Text, View } from "react-native";
import MapView, { Polyline, PROVIDER_DEFAULT } from "react-native-maps";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

/** Fallback: all of Italy. The map is FULLY functional with zero permissions. */
const ITALY_REGION: MapRegion = {
  latitude: 41.9,
  longitude: 12.5,
  latitudeDelta: 10,
  longitudeDelta: 10,
};

/** Show trail/area polylines only when zoomed in enough to read them. */
const GEOMETRY_MAX_DELTA = 0.2;
/** The add-place FAB appears only below this zoom span. */
const ADD_PLACE_MAX_DELTA = 0.08;

export interface PlacesMapViewProps {
  /** The kinds this tool exposes (filter bar, add-place form, defaults). */
  allowedKinds: PlaceKind[];
  /** Persisted layer selection (already validated by the tool contract). */
  initialKinds: PlaceKind[] | null;
  /** Debounced + deduped layer-selection change — the tool persists it. */
  onKindsChange: (kinds: PlaceKind[]) => void;
}

/**
 * PlacesMapView — the species-agnostic places map engine, shared by
 * `pet-places` (services only, every owner) and `dog-friendly-places` (the dog
 * superset) — the FoodPlantToxicityView / CatPlantToxicityTool precedent: same
 * view, different tool id + kind set.
 *
 * Everything species-specific enters via props; persistence/premium/telemetry
 * stay in the loader + thin tool wrappers, keeping tools pure.
 */
export function PlacesMapView({
  allowedKinds,
  initialKinds,
  onKindsChange,
}: PlacesMapViewProps) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const mapRef = React.useRef<MapView>(null);

  // Sanitize the persisted selection against THIS tool's kind set — a stale
  // persisted value (or one saved by a newer build) must not leak layers.
  const [kinds, setKinds] = React.useState<PlaceKind[]>(() => {
    const allowed = new Set(allowedKinds);
    const sanitized = (initialKinds ?? []).filter((k) => allowed.has(k));
    return sanitized.length > 0 ? sanitized : allowedKinds;
  });
  const [region, setRegion] = React.useState<MapRegion>(ITALY_REGION);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [adding, setAdding] = React.useState(false);

  // Persist the layer selection (debounced so chip-tapping doesn't PUT per tap).
  const debouncedKinds = useDebounce(kinds, 800);
  const lastNotified = React.useRef<string | null>(null);
  React.useEffect(() => {
    const key = [...debouncedKinds].sort().join(",");
    if (debouncedKinds.length > 0 && lastNotified.current !== key) {
      lastNotified.current = key;
      onKindsChange(debouncedKinds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedKinds]);

  // Viewport-driven data: debounce the region, snap the bbox (in the hook).
  const debouncedRegion = useDebouncedRegion(region, 500);
  const { data } = usePlacesNearby(debouncedRegion, kinds);
  const tooWide = isRegionTooWide(region);

  const { clusters, getExpansionZoom } = useClusters(data?.items, region);

  // Trail/area polyline for the selected place, drawn when zoomed in.
  const { data: selectedPlace } = usePlace(selectedId);
  const showGeometry =
    selectedPlace?.geometry != null &&
    selectedPlace.geometry.length >= 2 &&
    region.latitudeDelta <= GEOMETRY_MAX_DELTA;

  const location = useUserLocation();

  // Search. The map center is passed as a tiebreaker so "veterinario" ranks
  // nearby vets first; it is never used as a filter.
  const search = useAddressSearch(kinds, {
    lat: region.latitude,
    lng: region.longitude,
  });
  const searchOpen =
    search.status !== "idle" &&
    (search.cities.length > 0 ||
      search.places.length > 0 ||
      search.addresses.length > 0 ||
      search.status === "done" ||
      search.status === "degraded");

  function dismissSearch() {
    Keyboard.dismiss();
    search.clear();
  }

  function onPickSearchResult(target: SearchTarget) {
    // Clearing before animating kills the dropdown without a flash, and
    // stops it reopening on the next render (the SpeciesStep discipline).
    search.clear();
    Keyboard.dismiss();
    animateTo(target.lat, target.lng, target.spanDeg);
    // No refetch needed here: animateToRegion settles into
    // onRegionChangeComplete, which drives the debounced nearby query.
  }

  function animateTo(latitude: number, longitude: number, delta: number) {
    mapRef.current?.animateToRegion(
      { latitude, longitude, latitudeDelta: delta, longitudeDelta: delta },
      350,
    );
  }

  function onClusterPress(clusterId: number, lat: number, lng: number) {
    let zoom: number;
    try {
      zoom = getExpansionZoom(clusterId) + 0.5;
    } catch {
      zoom = Math.log2(360 / region.longitudeDelta) + 2;
    }
    animateTo(lat, lng, 360 / 2 ** zoom);
  }

  async function onNearMePress() {
    if (!location.granted && !location.canAskAgain) {
      // The system prompt will not show again — point to Settings.
      toast.show({
        type: "warning",
        title: t("tools.places.locationDenied"),
      });
      void Linking.openSettings();
      return;
    }
    const locate = async () => {
      const coords = await location.request();
      if (coords) {
        animateTo(coords.latitude, coords.longitude, 0.05);
      } else {
        toast.show({
          type: "warning",
          title: t("tools.places.locationDenied"),
        });
      }
    };
    // iOS: MAI un messaggio custom prima del prompt di sistema. App Review ha
    // rifiutato la 1.8.0 (build 4) il 2026-08-07 per guideline 5.1.1(iv): un
    // dialog che permette di rimandare la richiesta con "annulla" è una
    // violazione — dopo il messaggio l'utente DEVE arrivare al prompt. Il
    // "perché" sta in NSLocationWhenInUseUsageDescription (app.config.ts), che
    // iOS mostra dentro il prompt stesso; il tap sul FAB "vicino a me" è già
    // l'intento esplicito. Non reintrodurre una rationale qui, nemmeno con un
    // solo bottone.
    if (location.granted || Platform.OS === "ios") {
      await locate();
      return;
    }
    // Android: il prompt di sistema non mostra alcuna motivazione e le policy
    // Play raccomandano una rationale in-context prima della richiesta.
    Alert.alert(t("tools.places.nearMe"), t("tools.places.locationRationale"), [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("common.continue"), onPress: () => void locate() },
    ]);
  }

  return (
    <View style={styles.root}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={StyleSheet.absoluteFill}
        initialRegion={ITALY_REGION}
        showsUserLocation={location.granted}
        showsMyLocationButton={false}
        toolbarEnabled={false}
        onRegionChangeComplete={setRegion}
        onPress={dismissSearch}
      >
        {clusters.map((c) => {
          const [lng, lat] = c.geometry.coordinates;
          if ("cluster" in c.properties && c.properties.cluster) {
            return (
              <ClusterMarker
                key={`c-${c.properties.cluster_id}`}
                clusterId={c.properties.cluster_id}
                count={c.properties.point_count}
                latitude={lat}
                longitude={lng}
                onPress={onClusterPress}
              />
            );
          }
          return (
            <PlaceMarker
              key={c.properties.placeId}
              id={c.properties.placeId}
              kind={c.properties.kind}
              latitude={lat}
              longitude={lng}
              onPress={setSelectedId}
            />
          );
        })}
        {showGeometry && selectedPlace?.geometry ? (
          <Polyline
            coordinates={selectedPlace.geometry.map((p) => ({
              latitude: p.lat,
              longitude: p.lng,
            }))}
            strokeColor={theme.colors.primary}
            strokeWidth={3}
          />
        ) : null}
      </MapView>

      {/* Single absolute column for everything that floats at the top.
          `box-none` is load-bearing: without it this full-width container
          would swallow map pans in its empty gaps. */}
      <View style={styles.topOverlay} pointerEvents="box-none">
        <View style={styles.inset}>
          <PlaceSearchBar
            value={search.query}
            onChangeText={search.setQuery}
            onSubmit={() => void search.submit()}
            onClear={search.clear}
            loading={search.status === "loading"}
          />
        </View>
        <PlaceKindFilterBar
          allowedKinds={allowedKinds}
          value={kinds}
          onChange={setKinds}
        />
        {searchOpen ? (
          <View style={styles.inset}>
            <PlaceSearchResults
              cities={search.cities}
              places={search.places}
              addresses={search.addresses}
              status={search.status}
              onPick={onPickSearchResult}
            />
          </View>
        ) : null}
      </View>

      {/* ODbL: attribution must be visible on the map surface. */}
      <View style={styles.attribution}>
        <Text style={styles.attributionText}>
          {data?.attribution ?? "© OpenStreetMap contributors"}
        </Text>
      </View>

      {(tooWide || data?.truncated) && (
        <View style={styles.hint} pointerEvents="none">
          <Text style={styles.hintText}>
            {t("tools.places.zoomIn")}
          </Text>
        </View>
      )}

      <NorboPressable
        haptic="light"
        scale="cta"
        style={styles.nearMeFab}
        onPress={() => void onNearMePress()}
      >
        <MaterialCommunityIcons
          name="crosshairs-gps"
          size={22}
          color={theme.colors.textOnPrimary}
        />
      </NorboPressable>

      {/* Add-place: usable only when zoomed in enough that the map center
          is a meaningful position proposal. */}
      {region.latitudeDelta <= ADD_PLACE_MAX_DELTA ? (
        <NorboPressable
          haptic="light"
          scale="cta"
          style={styles.addFab}
          onPress={() => setAdding(true)}
        >
          <MaterialCommunityIcons
            name="plus"
            size={22}
            color={theme.colors.primary}
          />
        </NorboPressable>
      ) : null}

      <PlaceDetailSheet
        placeId={selectedId}
        onClose={() => setSelectedId(null)}
      />
      <AddPlaceSheet
        visible={adding}
        allowedKinds={allowedKinds}
        lat={region.latitude}
        lng={region.longitude}
        onClose={() => setAdding(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: { flex: 1 },
  // No horizontal padding here: the chip row scrolls edge-to-edge and would
  // be clipped by it. The inset lives on the search bar and results panel.
  topOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingTop: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  inset: {
    marginHorizontal: theme.spacing.lg,
  },
  attribution: {
    position: "absolute",
    bottom: theme.spacing.sm,
    left: theme.spacing.sm,
    backgroundColor: theme.colors.surfaceOverlay,
    paddingHorizontal: theme.spacing.xs,
    borderRadius: theme.radius.xs,
  },
  attributionText: {
    fontSize: 10,
    color: theme.colors.textSecondary,
  },
  hint: {
    position: "absolute",
    bottom: theme.spacing["3xl"],
    alignSelf: "center",
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.pill,
    borderWidth: theme.hairline,
    borderColor: theme.colors.border,
  },
  hintText: {
    ...theme.typography.footnote,
    color: theme.colors.textSecondary,
  },
  nearMeFab: {
    position: "absolute",
    right: theme.spacing.lg,
    bottom: theme.spacing["4xl"],
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  addFab: {
    position: "absolute",
    right: theme.spacing.lg,
    bottom: theme.spacing["4xl"] + 48 + theme.spacing.md,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.primaryBorder,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
}));

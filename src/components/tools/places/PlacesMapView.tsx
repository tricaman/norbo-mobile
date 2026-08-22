import { NorboPressable } from "@/components/CustomPressable";
import { AddPlaceSheet } from "@/components/tools/places/AddPlaceSheet";
import { ClusterMarker } from "@/components/tools/places/ClusterMarker";
import { PlaceDetailSheet } from "@/components/tools/places/PlaceDetailSheet";
import { PlaceFilterDrawer } from "@/components/tools/places/PlaceFilterDrawer";
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
  /** The kinds this tool exposes (filter drawer, add-place form). */
  allowedKinds: PlaceKind[];
  /**
   * Layers to switch on when there is no usable persisted selection — the
   * caller's chance to personalize the first open (e.g. dog layers only for
   * dog owners). Sanitized like `initialKinds`; empty or omitted means all
   * of `allowedKinds`.
   */
  defaultKinds?: PlaceKind[];
  /** Persisted layer selection (already validated by the tool contract). */
  initialKinds: PlaceKind[] | null;
  /** Debounced + deduped layer-selection change — the tool persists it. */
  onKindsChange: (kinds: PlaceKind[]) => void;
}

const kindsKey = (kinds: PlaceKind[]) => [...kinds].sort().join(",");

/**
 * PlacesMapView — the places map engine behind `pet-places`, the one map of
 * every place an owner needs. Which layers exist and which start on are the
 * caller's call (`allowedKinds` / `defaultKinds`), so the engine stays free of
 * species logic.
 *
 * Persistence/premium/telemetry stay in the loader + the thin tool wrapper,
 * keeping the tool pure.
 */
export function PlacesMapView({
  allowedKinds,
  defaultKinds,
  initialKinds,
  onKindsChange,
}: PlacesMapViewProps) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const mapRef = React.useRef<MapView>(null);

  // Sanitize the persisted selection against THIS tool's kind set — a stale
  // persisted value (or one saved by a newer build) must not leak layers.
  // Persisted wins; then the caller's personalized defaults; then everything.
  const [kinds, setKinds] = React.useState<PlaceKind[]>(() => {
    const allowed = new Set(allowedKinds);
    const keep = (list: PlaceKind[]) => list.filter((k) => allowed.has(k));
    const persisted = keep(initialKinds ?? []);
    if (persisted.length > 0) return persisted;
    const defaults = keep(defaultKinds ?? []);
    return defaults.length > 0 ? defaults : allowedKinds;
  });
  const [region, setRegion] = React.useState<MapRegion>(ITALY_REGION);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [adding, setAdding] = React.useState(false);
  const [filtersOpen, setFiltersOpen] = React.useState(false);

  // Persist the layer selection (debounced so toggling doesn't PUT per tap).
  const debouncedKinds = useDebounce(kinds, 800);
  // Seeded with the initial selection, NOT null: `useDebounce` returns its
  // value immediately, so a null seed made every mount fire a PUT the user
  // never asked for — which also overwrote a server-side selection that had
  // not arrived yet, and fired a bogus tool_completed. Defaults are now
  // persisted only once the user actually touches a filter.
  const lastNotified = React.useRef<string>(kindsKey(kinds));
  const notify = React.useCallback(
    (next: PlaceKind[]) => {
      const key = kindsKey(next);
      if (next.length === 0 || lastNotified.current === key) return;
      lastNotified.current = key;
      onKindsChange(next);
    },
    [onKindsChange],
  );
  React.useEffect(() => {
    notify(debouncedKinds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedKinds]);

  // `initialKinds` arrives null on a cold cache and only fills in once the
  // server GET lands — after this component has already seeded itself. Adopt
  // it then, or the saved selection is ignored for the whole session AND the
  // first toggle persists the defaults over it. Only until the user touches
  // the filters: after that their choice outranks anything still in flight.
  const touched = React.useRef(false);
  const initialKey = initialKinds ? kindsKey(initialKinds) : null;
  React.useEffect(() => {
    if (touched.current || initialKinds == null) return;
    const allowed = new Set(allowedKinds);
    const persisted = initialKinds.filter((k) => allowed.has(k));
    if (persisted.length === 0) return;
    const key = kindsKey(persisted);
    if (key === lastNotified.current) return;
    setKinds(persisted);
    // It came FROM the store — adopting it must not write it straight back.
    lastNotified.current = key;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialKey]);

  const changeKinds = React.useCallback(
    (update: (current: PlaceKind[]) => PlaceKind[]) => {
      touched.current = true;
      setKinds(update);
    },
    [],
  );

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
        <View style={[styles.inset, styles.searchRow]}>
          <NorboPressable
            haptic="light"
            scale="row"
            style={styles.filterButton}
            onPress={() => setFiltersOpen(true)}
            accessibilityLabel={t("tools.places.filters.open")}
          >
            <View style={styles.filterButtonCard}>
              <MaterialCommunityIcons
                name="menu"
                size={20}
                color={theme.colors.textSecondary}
              />
            </View>
            {/* Outside the elevated card on purpose: Android clips a child
                that overflows an elevated view. Only rendered while something
                is hidden — otherwise the count is noise, and its absence is
                what tells you nothing is filtered out. */}
            {kinds.length < allowedKinds.length ? (
              <View style={styles.filterBadge} pointerEvents="none">
                <Text style={styles.filterBadgeText}>{kinds.length}</Text>
              </View>
            ) : null}
          </NorboPressable>
          <View style={styles.searchFill}>
            <PlaceSearchBar
              value={search.query}
              onChangeText={search.setQuery}
              onSubmit={() => void search.submit()}
              onClear={search.clear}
              loading={search.status === "loading"}
            />
          </View>
        </View>
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

      <PlaceFilterDrawer
        visible={filtersOpen}
        allowedKinds={allowedKinds}
        value={kinds}
        onChange={changeKinds}
        onClose={() => {
          setFiltersOpen(false);
          // Don't wait out the debounce: leaving the screen right after a
          // toggle would otherwise lose the change.
          notify(kinds);
        }}
      />
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
  // No horizontal padding here: the inset lives on the rows themselves, so a
  // future edge-to-edge child isn't boxed in by the container.
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
  searchRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: theme.spacing.sm,
  },
  searchFill: { flex: 1 },
  filterButton: {
    width: 44,
  },
  // Same card recipe as PlaceSearchBar (surface, hairline, radius, lift) so
  // the two read as one control over the map tiles.
  filterButtonCard: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: theme.hairline,
    borderColor: theme.colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  filterBadge: {
    position: "absolute",
    top: -5,
    right: -4,
    minWidth: 18,
    height: 18,
    paddingHorizontal: theme.spacing.xs,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.primary,
    borderWidth: 1.5,
    borderColor: theme.colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBadgeText: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "600",
    color: theme.colors.textOnPrimary,
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

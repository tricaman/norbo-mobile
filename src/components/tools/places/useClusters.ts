import type { Bbox, MapRegion } from "@/hooks/usePlaces";
import type { PlaceSummary } from "@/types/place.types";
import React from "react";
import Supercluster from "supercluster";

export interface ClusterPointProps {
  placeId: string;
  kind: PlaceSummary["kind"];
  name: string | null;
}

export type ClusterFeature =
  | Supercluster.ClusterFeature<ClusterPointProps>
  | Supercluster.PointFeature<ClusterPointProps>;

/** Approximate web-mercator zoom from the visible longitude span. */
export function zoomFromRegion(region: MapRegion): number {
  return Math.round(Math.log2(360 / region.longitudeDelta));
}

/**
 * supercluster over the current result set, re-indexed in a useMemo keyed on
 * the data and re-cut on (zoom, bbox). ~200 points max (server limit) →
 * indexing is sub-ms.
 */
export function useClusters(
  places: PlaceSummary[] | undefined,
  region: MapRegion | null,
): {
  clusters: ClusterFeature[];
  /** Zoom that expands a cluster — for tap-to-zoom. */
  getExpansionZoom: (clusterId: number) => number;
} {
  const index = React.useMemo(() => {
    const sc = new Supercluster<ClusterPointProps>({
      radius: 48,
      maxZoom: 16,
    });
    sc.load(
      (places ?? []).map((p) => ({
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: [p.lng, p.lat] },
        properties: { placeId: p.id, kind: p.kind, name: p.name },
      })),
    );
    return sc;
  }, [places]);

  const clusters = React.useMemo(() => {
    if (!region) return [];
    const bbox: Bbox = {
      minLat: region.latitude - region.latitudeDelta / 2,
      minLng: region.longitude - region.longitudeDelta / 2,
      maxLat: region.latitude + region.latitudeDelta / 2,
      maxLng: region.longitude + region.longitudeDelta / 2,
    };
    // supercluster types cluster features as AnyProps — narrow to ours.
    return index.getClusters(
      [bbox.minLng, bbox.minLat, bbox.maxLng, bbox.maxLat],
      zoomFromRegion(region),
    ) as ClusterFeature[];
  }, [index, region]);

  const getExpansionZoom = React.useCallback(
    (clusterId: number) => index.getClusterExpansionZoom(clusterId),
    [index],
  );

  return { clusters, getExpansionZoom };
}

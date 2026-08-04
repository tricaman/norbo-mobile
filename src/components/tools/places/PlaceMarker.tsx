import { getKindMeta } from "@/components/tools/places/kind-meta";
import type { PlaceKind } from "@/types/place.types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { View } from "react-native";
import { Marker } from "react-native-maps";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

interface PlaceMarkerProps {
  id: string;
  kind: PlaceKind;
  latitude: number;
  longitude: number;
  onPress: (id: string) => void;
}

/**
 * A single place pin.
 *
 * `tracksViewChanges={false}` is MANDATORY: with custom children and the
 * default `true`, every marker re-rasterizes each frame and FPS collapses
 * past ~50 markers. This one prop is the difference between smooth and
 * unusable.
 */
function PlaceMarkerInner({
  id,
  kind,
  latitude,
  longitude,
  onPress,
}: PlaceMarkerProps) {
  const { theme } = useUnistyles();
  return (
    <Marker
      coordinate={{ latitude, longitude }}
      tracksViewChanges={false}
      anchor={{ x: 0.5, y: 0.5 }}
      onPress={() => onPress(id)}
    >
      <View style={styles.pin}>
        <MaterialCommunityIcons
          name={
            getKindMeta(kind).icon as React.ComponentProps<
              typeof MaterialCommunityIcons
            >["name"]
          }
          size={16}
          color={theme.colors.textOnPrimary}
        />
      </View>
    </Marker>
  );
}

export const PlaceMarker = React.memo(PlaceMarkerInner);

const styles = StyleSheet.create((theme) => ({
  pin: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.colors.primary,
    borderWidth: 2,
    borderColor: theme.colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
}));

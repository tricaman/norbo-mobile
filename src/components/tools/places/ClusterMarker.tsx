import React from "react";
import { Text, View } from "react-native";
import { Marker } from "react-native-maps";
import { StyleSheet } from "react-native-unistyles";

interface ClusterMarkerProps {
  clusterId: number;
  count: number;
  latitude: number;
  longitude: number;
  onPress: (clusterId: number, latitude: number, longitude: number) => void;
}

/** Themed cluster bubble. Same tracksViewChanges rule as PlaceMarker. */
function ClusterMarkerInner({
  clusterId,
  count,
  latitude,
  longitude,
  onPress,
}: ClusterMarkerProps) {
  return (
    <Marker
      coordinate={{ latitude, longitude }}
      tracksViewChanges={false}
      anchor={{ x: 0.5, y: 0.5 }}
      onPress={() => onPress(clusterId, latitude, longitude)}
    >
      <View style={styles.bubble}>
        <Text style={styles.count}>{count > 99 ? "99+" : String(count)}</Text>
      </View>
    </Marker>
  );
}

export const ClusterMarker = React.memo(ClusterMarkerInner);

const styles = StyleSheet.create((theme) => ({
  bubble: {
    minWidth: 36,
    height: 36,
    borderRadius: 18,
    paddingHorizontal: theme.spacing.xs,
    backgroundColor: theme.colors.primary,
    borderWidth: 2,
    borderColor: theme.colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  count: {
    ...theme.typography.footnote,
    fontWeight: "700",
    color: theme.colors.textOnPrimary,
  },
}));

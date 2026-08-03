import { NorboPressable } from "@/components/CustomPressable";
import { KIND_META } from "@/components/tools/places/kind-meta";
import { useMutation, type ApiError } from "@/hooks/useMutation";
import { placesApi, type SubmitPlaceInput } from "@/services/places.api";
import { PLACE_KINDS, type PlaceKind } from "@/types/place.types";
import { toast } from "@/utils/toast";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

interface AddPlaceSheetProps {
  visible: boolean;
  /** Proposed position = the map center when the sheet was opened. */
  lat: number;
  lng: number;
  onClose: () => void;
}

interface AmenityToggle {
  key: "fenced" | "hasWater" | "lit" | "offLeash";
  labelKey: string;
}

const AMENITIES: AmenityToggle[] = [
  { key: "fenced", labelKey: "tools.dogFriendlyPlaces.detail.fenced" },
  { key: "offLeash", labelKey: "tools.dogFriendlyPlaces.detail.offLeash" },
  { key: "hasWater", labelKey: "tools.dogFriendlyPlaces.detail.water" },
  { key: "lit", labelKey: "tools.dogFriendlyPlaces.detail.lit" },
];

/**
 * User place submission form — inline Modal (the tool stays pure, no
 * navigation). The position is the current map center: the user frames the
 * spot by panning, then fills kind + name + amenity toggles. Submissions are
 * PENDING until approved (moderation-first) — the success toast says so.
 */
export function AddPlaceSheet({ visible, lat, lng, onClose }: AddPlaceSheetProps) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();

  const [kind, setKind] = React.useState<PlaceKind>("DOG_PARK");
  const [name, setName] = React.useState("");
  const [amenities, setAmenities] = React.useState<
    Partial<Record<AmenityToggle["key"], boolean>>
  >({});

  const submit = useMutation<{ id: string }, ApiError, SubmitPlaceInput>({
    mutationFn: (input) => placesApi.submit(input).then((r) => r.data),
    showErrorToast: false,
    onSuccess: () => {
      toast.show({
        type: "success",
        title: t("tools.dogFriendlyPlaces.addPlace.submitted"),
      });
      setName("");
      setAmenities({});
      onClose();
    },
    onError: (error) => {
      const code = error.response?.data?.errorCode;
      toast.show({
        type: "error",
        title:
          code === "PLC003"
            ? t("tools.dogFriendlyPlaces.addPlace.duplicate")
            : code === "PLC004"
              ? t("tools.dogFriendlyPlaces.addPlace.limit")
              : t("common.failedToSave"),
      });
    },
  });

  const canSubmit = name.trim().length >= 2 && !submit.isPending;

  function toggleAmenity(key: AmenityToggle["key"]) {
    setAmenities((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function onSubmit() {
    submit.mutate({
      kind,
      name: name.trim(),
      lat,
      lng,
      // Only assert what the user actually toggled on; unknown stays null.
      fenced: amenities.fenced ? true : null,
      offLeash: amenities.offLeash ? true : null,
      hasWater: amenities.hasWater ? true : null,
      lit: amenities.lit ? true : null,
    });
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropTap} onPress={onClose} />
        <View style={styles.sheet}>
          <Text style={styles.title}>
            {t("tools.dogFriendlyPlaces.addPlace.title")}
          </Text>
          <Text style={styles.hint}>
            {t("tools.dogFriendlyPlaces.addPlace.positionHint")}{" "}
            <Text style={styles.mono}>
              {lat.toFixed(5)}, {lng.toFixed(5)}
            </Text>
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.kindRow}
            style={styles.kindScroll}
          >
            {PLACE_KINDS.map((k) => {
              const active = k === kind;
              return (
                <NorboPressable
                  key={k}
                  haptic="light"
                  scale="row"
                  onPress={() => setKind(k)}
                >
                  <View
                    style={[
                      styles.chip,
                      active && {
                        backgroundColor: theme.colors.primary,
                        borderColor: theme.colors.primary,
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={
                        KIND_META[k].icon as React.ComponentProps<
                          typeof MaterialCommunityIcons
                        >["name"]
                      }
                      size={14}
                      color={
                        active
                          ? theme.colors.textOnPrimary
                          : theme.colors.textTertiary
                      }
                    />
                    <Text
                      style={[
                        styles.chipLabel,
                        active && { color: theme.colors.textOnPrimary },
                      ]}
                    >
                      {t(KIND_META[k].labelKey as never)}
                    </Text>
                  </View>
                </NorboPressable>
              );
            })}
          </ScrollView>

          <TextInput
            style={styles.input}
            placeholder={t("tools.dogFriendlyPlaces.addPlace.namePlaceholder")}
            placeholderTextColor={theme.colors.textTertiary}
            value={name}
            onChangeText={setName}
            maxLength={120}
          />

          <View style={styles.amenityRow}>
            {AMENITIES.map((a) => {
              const active = Boolean(amenities[a.key]);
              return (
                <NorboPressable
                  key={a.key}
                  haptic="light"
                  scale="row"
                  onPress={() => toggleAmenity(a.key)}
                >
                  <View
                    style={[
                      styles.chip,
                      active && {
                        backgroundColor: theme.colors.primarySoft,
                        borderColor: theme.colors.primaryBorder,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipLabel,
                        active && { color: theme.colors.primary },
                      ]}
                    >
                      {t(a.labelKey as never)}
                    </Text>
                  </View>
                </NorboPressable>
              );
            })}
          </View>

          <NorboPressable
            haptic="medium"
            scale="cta"
            onPress={onSubmit}
            disabled={!canSubmit}
            style={[styles.submit, !canSubmit && styles.submitDisabled]}
          >
            {submit.isPending ? (
              <ActivityIndicator color={theme.colors.textOnPrimary} />
            ) : (
              <Text style={styles.submitLabel}>
                {t("tools.dogFriendlyPlaces.addPlace.submit")}
              </Text>
            )}
          </NorboPressable>
          <Text style={styles.moderationNote}>
            {t("tools.dogFriendlyPlaces.addPlace.moderationNote")}
          </Text>
        </View>
      </View>
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
  title: {
    ...theme.typography.title2,
    color: theme.colors.textPrimary,
  },
  hint: {
    ...theme.typography.footnote,
    color: theme.colors.textSecondary,
  },
  mono: { ...theme.monoTypography.captionMono },
  kindScroll: { flexGrow: 0 },
  kindRow: { gap: theme.spacing.xs },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface2,
  },
  chipLabel: {
    ...theme.typography.footnote,
    color: theme.colors.textSecondary,
  },
  input: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.surface2,
    borderRadius: theme.radius.md,
    borderWidth: theme.hairline,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  amenityRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
  },
  submit: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    paddingVertical: theme.spacing.md,
    alignItems: "center",
  },
  submitDisabled: { opacity: 0.5 },
  submitLabel: {
    ...theme.typography.body,
    fontWeight: "600",
    color: theme.colors.textOnPrimary,
  },
  moderationNote: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
  },
}));

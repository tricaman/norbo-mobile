import { NorboPressable } from "@/components/CustomPressable";
import { getKindMeta, KIND_GROUPS } from "@/components/tools/places/kind-meta";
import type { PlaceKind } from "@/types/place.types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInLeft,
  SlideOutLeft,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

interface PlaceFilterDrawerProps {
  visible: boolean;
  onClose: () => void;
  /** The kinds this tool exposes; groups are intersected with it. */
  allowedKinds: PlaceKind[];
  /** Live selection — every toggle applies immediately. */
  value: PlaceKind[];
  /**
   * Updater, not a value: two taps can land in one React batch (the press
   * arrives via runOnJS, and re-clustering can delay the render in between),
   * and a value computed from the rendered props would silently revert the
   * earlier tap.
   */
  onChange: (update: (current: PlaceKind[]) => PlaceKind[]) => void;
}

const EXIT_MS = 200;
const NOTICE_MS = 2500;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Layer filters for the places map, as a drawer sliding in from the left.
 *
 * Replaces the horizontal chip row: with all ten layers the chips no longer
 * fit, and grouping them is what makes the set legible. Sections come from
 * `KIND_GROUPS` and are rendered blindly, so adding a group (other species,
 * amenity filters) never touches this file.
 *
 * A transparent `Modal` — like every other overlay in this feature — because
 * it gets Android hardware-back for free and covers the screen header, which
 * an in-place absolute overlay cannot. `animationType="none"`: RN only slides
 * modals from the bottom, so the motion is reanimated's. The Modal outlives
 * `visible` by `EXIT_MS` (`rendered`) purely so the exit animation can play.
 *
 * Toggles apply immediately (the map redraws behind the panel); batching is
 * the caller's debounce, not a draft/apply step here.
 */
export function PlaceFilterDrawer({
  visible,
  onClose,
  allowedKinds,
  value,
  onChange,
}: PlaceFilterDrawerProps) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const insets = useSafeAreaInsets();

  // Shown in the panel, NOT via toast: a Modal is its own native window, so
  // the app-root toast host paints underneath it and the message never
  // appears — which would make a refused tap look like a dead control.
  const [notice, setNotice] = React.useState<string | null>(null);
  const noticeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(
    () => () => {
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
    },
    [],
  );
  function warnMinOne() {
    setNotice(t("tools.places.filters.minOne"));
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), NOTICE_MS);
  }

  const [rendered, setRendered] = React.useState(visible);
  React.useEffect(() => {
    if (visible) {
      setRendered(true);
      return;
    }
    // Drop any pending warning: it belongs to the tap that just happened, and
    // reopening the panel must not resurrect it out of context.
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    setNotice(null);
    const id = setTimeout(() => setRendered(false), EXIT_MS);
    return () => clearTimeout(id);
  }, [visible]);

  const selected = React.useMemo(() => new Set(value), [value]);
  const allowed = React.useMemo(() => new Set(allowedKinds), [allowedKinds]);

  /**
   * Every mutation goes through the updater and re-derives the list in
   * `allowedKinds` order, so the result is canonical and can never be empty
   * however stale the render that produced the tap was.
   */
  function apply(next: (current: Set<PlaceKind>) => void) {
    onChange((current) => {
      const set = new Set(current);
      next(set);
      const result = allowedKinds.filter((k) => set.has(k));
      return result.length > 0 ? result : current;
    });
  }

  function toggle(kind: PlaceKind) {
    // The contract requires ≥1 layer, and an empty map looks broken anyway.
    // Checked against the rendered value only to decide the message; `apply`
    // is what actually guarantees it.
    if (selected.has(kind) && value.length === 1) {
      warnMinOne();
      return;
    }
    apply((set) => {
      if (set.has(kind)) set.delete(kind);
      else set.add(kind);
    });
  }

  function toggleGroup(kinds: PlaceKind[]) {
    // Only a deselect-all can empty the selection, so the direction has to be
    // decided BEFORE warning: a selection that lives entirely inside this
    // group (the default state for a user with no dog, minus one layer) would
    // otherwise have its select-all refused for "keeping one layer on".
    const turningOff = kinds.every((k) => selected.has(k));
    const inGroup = new Set(kinds);
    if (turningOff && value.length > 0 && value.every((k) => inGroup.has(k))) {
      warnMinOne();
      return;
    }
    apply((set) => {
      // Recomputed here, not read from the render: the group's direction has
      // to follow the selection this update actually starts from.
      if (kinds.every((k) => set.has(k))) kinds.forEach((k) => set.delete(k));
      else kinds.forEach((k) => set.add(k));
    });
  }

  if (!rendered) return null;

  return (
    <Modal
      visible
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* gesture-handler pressables need their own root inside a Modal */}
      <GestureHandlerRootView style={styles.root}>
        {visible ? (
          <>
            <AnimatedPressable
              entering={FadeIn.duration(180)}
              exiting={FadeOut.duration(EXIT_MS)}
              style={styles.backdrop}
              onPress={onClose}
              accessibilityLabel={t("tools.places.filters.close")}
            />

            <Animated.View
              entering={SlideInLeft.duration(240)}
              exiting={SlideOutLeft.duration(EXIT_MS)}
              style={[
                styles.panel,
                { paddingTop: insets.top, paddingBottom: insets.bottom },
              ]}
              accessibilityViewIsModal
            >
              <View style={styles.header}>
                <Text style={styles.title}>
                  {t("tools.places.filters.title")}
                </Text>
                <NorboPressable
                  haptic="light"
                  scale="row"
                  style={styles.closeBtn}
                  onPress={onClose}
                  accessibilityLabel={t("tools.places.filters.close")}
                >
                  <MaterialCommunityIcons
                    name="close"
                    size={20}
                    color={theme.colors.textSecondary}
                  />
                </NorboPressable>
              </View>

              {notice ? (
                <View style={styles.notice}>
                  <MaterialCommunityIcons
                    name="information-outline"
                    size={16}
                    color={theme.colors.warning}
                  />
                  <Text style={styles.noticeText}>{notice}</Text>
                </View>
              ) : null}

              <ScrollView bounces={false}>
                {KIND_GROUPS.map((group) => {
                  const kinds = group.kinds.filter((k) => allowed.has(k));
                  if (kinds.length === 0) return null;
                  const allOn = kinds.every((k) => selected.has(k));

                  return (
                    <View key={group.id}>
                      <View style={styles.groupHeader}>
                        <Text style={styles.groupTitle}>
                          {t(group.labelKey as never)}
                        </Text>
                        <NorboPressable
                          haptic="light"
                          scale="text"
                          style={styles.groupActionHit}
                          accessibilityRole="button"
                          onPress={() => toggleGroup(kinds)}
                          // On its own the label is just "all"/"none"; a
                          // screen reader needs to hear which group it acts on.
                          accessibilityLabel={`${t(group.labelKey as never)} — ${t(
                            allOn
                              ? "tools.places.filters.selectNone"
                              : "tools.places.filters.selectAll",
                          )}`}
                        >
                          <Text style={styles.groupAction}>
                            {t(
                              allOn
                                ? "tools.places.filters.selectNone"
                                : "tools.places.filters.selectAll",
                            )}
                          </Text>
                        </NorboPressable>
                      </View>

                      {kinds.map((kind, i) => {
                        const isSelected = selected.has(kind);
                        const meta = getKindMeta(kind);
                        return (
                          <View key={kind}>
                            {i > 0 ? <View style={styles.separator} /> : null}
                            <NorboPressable
                              haptic="light"
                              scale="row"
                              onPress={() => toggle(kind)}
                              accessibilityRole="checkbox"
                              accessibilityState={{ checked: isSelected }}
                              style={[
                                styles.row,
                                isSelected && {
                                  backgroundColor: theme.colors.primarySoft,
                                },
                              ]}
                            >
                              <MaterialCommunityIcons
                                name={
                                  meta.icon as React.ComponentProps<
                                    typeof MaterialCommunityIcons
                                  >["name"]
                                }
                                size={20}
                                color={
                                  isSelected
                                    ? theme.colors.primary
                                    : theme.colors.textTertiary
                                }
                              />
                              <Text
                                style={[
                                  styles.rowLabel,
                                  isSelected
                                    ? styles.rowLabelOn
                                    : styles.rowLabelOff,
                                ]}
                                numberOfLines={2}
                              >
                                {meta.labelKey
                                  ? t(meta.labelKey as never)
                                  : kind.toLowerCase()}
                              </Text>
                              <MaterialCommunityIcons
                                name={
                                  isSelected
                                    ? "checkbox-marked"
                                    : "checkbox-blank-outline"
                                }
                                size={22}
                                color={
                                  isSelected
                                    ? theme.colors.primary
                                    : theme.colors.textTertiary
                                }
                              />
                            </NorboPressable>
                          </View>
                        );
                      })}
                    </View>
                  );
                })}
              </ScrollView>
            </Animated.View>
          </>
        ) : null}
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: { flex: 1 },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.scrim,
  },
  panel: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: "80%",
    maxWidth: 320,
    backgroundColor: theme.colors.surface,
    borderRightWidth: theme.hairline,
    borderRightColor: theme.colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 3, height: 0 },
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: theme.hairline,
    borderBottomColor: theme.colors.border,
  },
  title: {
    ...theme.typography.subhead,
    color: theme.colors.textPrimary,
  },
  // Matches the header back button's box, so this hairline lands on the same
  // line as the screen header's behind the panel.
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  notice: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.warningSoft,
  },
  noticeText: {
    ...theme.typography.footnote,
    color: theme.colors.textPrimary,
    flex: 1,
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
  },
  // A bare Text shrink-wraps to ~20x18pt, far under the 44pt floor. Negative
  // margins let the hit box grow into the header's padding without moving the
  // label, and NorboPressable exposes no hitSlop to lean on.
  groupActionHit: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: theme.spacing.md,
    marginRight: -theme.spacing.md,
    marginVertical: -theme.spacing.sm,
  },
  groupTitle: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
  },
  groupAction: {
    ...theme.typography.footnote,
    color: theme.colors.primary,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    minHeight: 48,
  },
  rowLabel: {
    ...theme.typography.body,
    flex: 1,
  },
  rowLabelOn: {
    color: theme.colors.textPrimary,
    fontWeight: "600",
  },
  rowLabelOff: {
    color: theme.colors.textSecondary,
  },
  separator: {
    height: theme.hairline,
    marginLeft: theme.spacing.xl,
    backgroundColor: theme.colors.border,
  },
}));

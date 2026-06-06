import { NorboPressable } from "@/components/CustomPressable";
import { PetCategoryIcon } from "@/components/pets/wizard/PetCategoryIcon";
import { CATEGORY_META } from "@/components/pets/wizard/category-meta";
import { Dropdown } from "@/components/ui/Dropdown";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { QueryBoundary } from "@/components/ui/QueryBoundary";

import { queryClient } from "@/app/_layout";
import { PetTimeline } from "@/components/health-timeline/PetTimeline";
import { PetExpensesTab } from "@/components/pets/expenses/PetExpensesTab";
import { PetPhotosTab } from "@/components/pets/photos/PetPhotosTab";
import { PetWeightTab } from "@/components/pets/weights/PetWeightTab";
import { SegmentedTabs } from "@/components/ui/SegmentedTabs";
import { SCREEN_BOTTOM_PADDING } from "@/constants/layout";
import { useMutation } from "@/hooks/useMutation";
import { usePhotoCount } from "@/hooks/usePhotoAlbums";
import { useWeightHistory } from "@/hooks/useWeightHistory";
import { petsApi } from "@/services/pets.api";
import { remindersApi } from "@/services/reminders.api";
import { LifeStatus, Sex, type Pet } from "@/types/pet.types";
import { formatPetAge } from "@/utils/age";
import { formatWeight } from "@/utils/weight";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { enUS, it as itLocale } from "date-fns/locale";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Text, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

type PetDetailTab = "timeline" | "photos" | "expenses" | "weight" | "care";

const HERO_HEIGHT = 280;
const COLLAPSED_HERO_HEIGHT = 56;
// Map scroll → collapse 1:1 so the body content slides exactly with the
// shrinking header (no parallax mismatch, no feedback loop).
const SCROLL_THRESHOLD = HERO_HEIGHT - COLLAPSED_HERO_HEIGHT;
// Sensible initial estimate for the floating group (stats card + tabs +
// surrounding paddings). Refined via onLayout on first render.
const FLOATING_GROUP_ESTIMATE = 144;

export default function PetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useUnistyles();

  const query = useQuery({
    queryKey: ["pets", id],
    queryFn: () => petsApi.get(id).then((r) => r.data),
    enabled: !!id,
  });

  // Full-bleed hero layout: Screen primitive omitted intentionally.
  // Safe area is handled via useSafeAreaInsets() inside PetDetailContent
  // so the hero zone extends behind the status bar.
  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <QueryBoundary query={query}>
        {(pet) => <PetDetailContent pet={pet} petId={id} />}
      </QueryBoundary>
    </View>
  );
}

function PetDetailContent({ pet, petId }: { pet: Pet; petId: string }) {
  const { t, i18n } = useTranslation();
  const { theme } = useUnistyles();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [menuVisible, setMenuVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<PetDetailTab>("timeline");

  // Header is an absolute-positioned overlay; the scroll view is full-screen
  // with paddingTop = headerHeight. This decouples the scroll frame from the
  // hero collapse, so there's no feedback loop (the source of the trembling
  // when content was short enough to not fully collapse the hero).
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = Math.max(0, event.contentOffset.y);
    },
  });

  const [floatingGroupHeight, setFloatingGroupHeight] = useState(
    FLOATING_GROUP_ESTIMATE,
  );
  const onFloatingGroupLayout = useCallback(
    (e: { nativeEvent: { layout: { height: number } } }) => {
      const h = e.nativeEvent.layout.height;
      if (h > 0) setFloatingGroupHeight(h);
    },
    [],
  );
  const headerHeight = HERO_HEIGHT + insets.top + floatingGroupHeight;

  const heroAnimatedStyle = useAnimatedStyle(() => ({
    height: interpolate(
      scrollY.value,
      [0, SCROLL_THRESHOLD],
      [HERO_HEIGHT + insets.top, COLLAPSED_HERO_HEIGHT + insets.top],
      Extrapolation.CLAMP,
    ),
  }));

  const heroContentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [0, SCROLL_THRESHOLD * 0.5],
      [1, 0],
      Extrapolation.CLAMP,
    ),
  }));

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [0, SCROLL_THRESHOLD * 0.6],
      [1, 0],
      Extrapolation.CLAMP,
    ),
  }));

  const collapsedNameAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [SCROLL_THRESHOLD * 0.5, SCROLL_THRESHOLD * 0.8],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  }));

  const isDeceased = pet.lifeStatus === LifeStatus.DECEASED;
  const meta = CATEGORY_META[pet.category];
  const speciesLabel = pet.speciesLabelFreetext ?? null;

  const age = formatPetAge(pet.birthDate, t) ?? "";
  const pillText = [
    t(`petForm.categories.${pet.category}`).toUpperCase(),
    speciesLabel ? speciesLabel.toUpperCase() : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const subtitleParts: string[] = [];
  if (age) subtitleParts.push(age);
  if (pet.sex === Sex.MALE) subtitleParts.push("M");
  else if (pet.sex === Sex.FEMALE) subtitleParts.push("F");
  if (pet.sterilized) subtitleParts.push(t("petDetail.sterilized"));
  const subtitle = subtitleParts.join(" · ");

  const { latest: latestWeight } = useWeightHistory(petId);
  const weightLabel = latestWeight
    ? formatWeight(latestWeight.weightMg, { category: pet.category })
    : "—";

  const photoCountQuery = usePhotoCount(petId);
  const photoCountLabel =
    photoCountQuery.data != null ? String(photoCountQuery.data) : "—";

  const dateLocale = i18n.language.startsWith("it") ? itLocale : enUS;

  const nextReminderQuery = useQuery({
    queryKey: ["reminders", { petId, filter: "all" }],
    queryFn: () =>
      remindersApi
        .list({ filter: "all", petId, limit: 1 })
        .then((r) => r.data.rows[0] ?? null),
    enabled: !!petId && !isDeceased,
  });
  const nextReminderLabel = nextReminderQuery.data?.dueAt
    ? format(new Date(nextReminderQuery.data.dueAt), "d MMM", {
        locale: dateLocale,
      })
    : "—";

  const { mutate: deletePet } = useMutation({
    mutationFn: () => petsApi.delete(petId),
    showSuccessToast: true,
    successMessage: t("pets.deleteSuccess"),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["pets"] });
      router.back();
    },
  });

  const { mutate: restorePet } = useMutation({
    mutationFn: () => petsApi.restore(petId),
    showSuccessToast: true,
    successMessage: t("memorial.restoreSuccess", { name: pet.name }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["pets"] });
      void queryClient.invalidateQueries({ queryKey: ["pets", petId] });
    },
  });

  function confirmDelete() {
    Alert.alert(
      t("pets.deleteConfirmTitle"),
      t("pets.deleteConfirmMessage", { name: pet.name }),
      [
        { text: t("pets.deleteConfirmCancel"), style: "cancel" },
        {
          text: t("pets.deleteConfirmOk"),
          style: "destructive",
          onPress: () => deletePet(),
        },
      ],
    );
  }

  function confirmRestore() {
    Alert.alert(
      t("memorial.restoreConfirmTitle"),
      t("memorial.restoreConfirmMessage", { name: pet.name }),
      [
        { text: t("memorial.restoreConfirmCancel"), style: "cancel" },
        {
          text: t("memorial.restoreConfirmOk"),
          onPress: () => restorePet(),
        },
      ],
    );
  }

  const TABS: { key: PetDetailTab; label: string; icon: string }[] = [
    { key: "timeline", label: t("petDetail.tabs.timeline"), icon: "calendar" },
    {
      key: "photos",
      label: t("petDetail.tabs.photos"),
      icon: "photo.on.rectangle",
    },
    {
      key: "expenses",
      label: t("petDetail.tabs.expenses"),
      icon: "creditcard",
    },
    { key: "weight", label: t("petDetail.tabs.weight"), icon: "scalemass" },
    { key: "care", label: t("petDetail.tabs.care"), icon: "heart" },
  ];

  const PLACEHOLDER: Record<PetDetailTab, { icon: string; message: string }> = {
    timeline: {
      icon: "calendar",
      message: t("petDetail.timeline.empty"),
    },
    photos: { icon: "photo", message: t("petDetail.photos.empty") },
    expenses: {
      icon: "creditcard",
      message: t("petDetail.expenses.empty"),
    },
    weight: { icon: "scalemass", message: t("petDetail.weight.empty") },
    care: { icon: "heart", message: t("petDetail.care.empty") },
  };

  const STATS: {
    icon: string;
    value: string;
    label: string;
    onPress?: () => void;
  }[] = [
    {
      icon: "scalemass",
      value: weightLabel,
      label: t("petDetail.stats.weight"),
      onPress: () => setActiveTab("weight"),
    },
    ...(isDeceased
      ? []
      : [
          {
            icon: "bell",
            value: nextReminderLabel,
            label: t("petDetail.stats.next"),
          },
        ]),
    {
      icon: "photo",
      value: photoCountLabel,
      label: t("petDetail.stats.photos"),
      onPress: () => setActiveTab("photos"),
    },
  ];

  return (
    <View style={styles.screen}>
      {/* ── Tab content (full-screen; content padded under header) ─── */}
      {activeTab === "timeline" ? (
        <PetTimeline
          petId={petId}
          onScroll={scrollHandler}
          contentInsetTop={headerHeight}
        />
      ) : activeTab === "weight" ? (
        <PetWeightTab
          petId={petId}
          category={pet.category}
          onScroll={scrollHandler}
          contentInsetTop={headerHeight}
        />
      ) : activeTab === "photos" ? (
        <PetPhotosTab
          petId={petId}
          onScroll={scrollHandler}
          contentInsetTop={headerHeight}
        />
      ) : activeTab === "expenses" ? (
        <PetExpensesTab
          petId={petId}
          onScroll={scrollHandler}
          contentInsetTop={headerHeight}
        />
      ) : (
        <Animated.ScrollView
          key={activeTab}
          style={styles.tabContent}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          contentContainerStyle={[
            styles.tabContentInner,
            {
              paddingTop: headerHeight + theme.spacing["3xl"],
              paddingBottom: SCREEN_BOTTOM_PADDING + insets.bottom,
            },
          ]}
        >
          <View style={styles.placeholder}>
            <IconSymbol
              name={PLACEHOLDER[activeTab].icon}
              size={32}
              tintColor={theme.colors.textTertiary}
            />
            <Text
              style={[
                styles.placeholderText,
                { color: theme.colors.textTertiary },
              ]}
            >
              {PLACEHOLDER[activeTab].message}
            </Text>
          </View>
        </Animated.ScrollView>
      )}

      {/* ── Header overlay (absolute) ───────────────── */}
      <Animated.View style={styles.headerOverlay}>
        {/* ── Hero ───────────────────────────────────── */}
        <Animated.View
          style={[
            styles.hero,
            { backgroundColor: meta.tint },
            heroAnimatedStyle,
          ]}
        >
          {pet.photoUrl ? (
            <Animated.View style={[styles.heroPhoto, heroContentAnimatedStyle]}>
              <Image
                source={{ uri: pet.photoUrl }}
                style={{ flex: 1 }}
                contentFit="cover"
              />
            </Animated.View>
          ) : null}

          <Animated.View
            style={[styles.heroIconWrapper, heroContentAnimatedStyle]}
            pointerEvents="none"
          >
            <PetCategoryIcon
              category={pet.category}
              size={120}
              color="rgba(255,255,255,0.20)"
            />
          </Animated.View>

          <NorboPressable
            style={[styles.heroBtn, { top: insets.top + 10, left: 16 }]}
            scale="row"
            haptic="light"
            onPress={() => router.back()}
          >
            <IconSymbol name="chevron.left" size={20} tintColor="#fff" />
          </NorboPressable>

          <NorboPressable
            style={[styles.heroBtn, { top: insets.top + 10, right: 16 }]}
            scale="row"
            haptic="light"
            onPress={() => setMenuVisible(true)}
          >
            <IconSymbol name="ellipsis.horizontal" size={20} tintColor="#fff" />
          </NorboPressable>

          <Animated.View style={[styles.heroOverlay, overlayAnimatedStyle]}>
            <View style={styles.pillTag}>
              <Text style={styles.pillTagText} numberOfLines={1}>
                {pillText}
              </Text>
            </View>
            <Text style={styles.heroName}>{pet.name}</Text>
            {subtitle ? (
              <Text style={styles.heroSubtitle}>{subtitle}</Text>
            ) : null}
          </Animated.View>

          <Animated.View
            style={[
              styles.collapsedName,
              { top: insets.top + 10 },
              collapsedNameAnimatedStyle,
            ]}
            pointerEvents="none"
          >
            <Text style={styles.collapsedNameText} numberOfLines={1}>
              {pet.name}
            </Text>
          </Animated.View>
        </Animated.View>

        {/* ── Floating stats + tabs ───────────────── */}
        <View
          style={[
            styles.floatingGroup,
            { backgroundColor: theme.colors.background },
          ]}
          onLayout={onFloatingGroupLayout}
        >
          <View
            style={[
              styles.statsCard,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            {STATS.map((stat, i) => {
              const inner = stat.onPress ? (
                <View style={styles.statCellRow}>
                  <View style={styles.statContent}>
                    <IconSymbol
                      name={stat.icon}
                      size={16}
                      tintColor={theme.colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.statValue,
                        { color: theme.colors.textPrimary },
                      ]}
                    >
                      {stat.value}
                    </Text>
                    <Text
                      style={[
                        styles.statLabel,
                        { color: theme.colors.textTertiary },
                      ]}
                    >
                      {stat.label}
                    </Text>
                  </View>
                  <View style={styles.statChevron}>
                    <IconSymbol
                      name="chevron.right"
                      size={12}
                      tintColor={theme.colors.textTertiary}
                    />
                  </View>
                </View>
              ) : (
                <View style={styles.statContent}>
                  <IconSymbol
                    name={stat.icon}
                    size={16}
                    tintColor={theme.colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.statValue,
                      { color: theme.colors.textPrimary },
                    ]}
                  >
                    {stat.value}
                  </Text>
                  <Text
                    style={[
                      styles.statLabel,
                      { color: theme.colors.textTertiary },
                    ]}
                  >
                    {stat.label}
                  </Text>
                </View>
              );
              return (
                <React.Fragment key={stat.label}>
                  {i > 0 && (
                    <View
                      style={[
                        styles.statDivider,
                        { backgroundColor: theme.colors.border },
                      ]}
                    />
                  )}
                  {stat.onPress ? (
                    <NorboPressable
                      style={styles.statCell}
                      scale="row"
                      haptic="light"
                      onPress={stat.onPress}
                    >
                      {inner}
                    </NorboPressable>
                  ) : (
                    <View style={styles.statCell}>{inner}</View>
                  )}
                </React.Fragment>
              );
            })}
          </View>

          <SegmentedTabs<PetDetailTab>
            tabs={TABS}
            value={activeTab}
            onChange={setActiveTab}
            style={styles.tabs}
          />
        </View>
      </Animated.View>

      {activeTab === "expenses" && (
        <NorboPressable
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          haptic="medium"
          onPress={() =>
            router.push(`/expense/new?petId=${petId}&locked=1` as never)
          }
        >
          <IconSymbol
            name="plus"
            size={22}
            tintColor={theme.colors.textOnPrimary}
          />
        </NorboPressable>
      )}

      <Dropdown
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        items={
          isDeceased
            ? [
                {
                  label: t("memorial.restore"),
                  icon: "arrow.uturn.backward",
                  onPress: confirmRestore,
                },
                {
                  label: t("pets.deleteConfirmOk"),
                  icon: "trash.fill",
                  destructive: true,
                  onPress: confirmDelete,
                },
              ]
            : [
                {
                  label: t("petForm.editTitle"),
                  icon: "pencil",
                  onPress: () => router.push(`/pets/${petId}/edit`),
                },
                {
                  label: t("pets.deleteConfirmOk"),
                  icon: "trash.fill",
                  destructive: true,
                  onPress: confirmDelete,
                },
              ]
        }
      />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: {
    flex: 1,
  },
  screen: {
    flex: 1,
  },
  // Hero
  hero: {
    overflow: "hidden",
  },
  heroPhoto: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  heroIconWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 80,
  },
  heroBtn: {
    position: "absolute",
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.scrim,
    alignItems: "center",
    justifyContent: "center",
  },
  heroOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: theme.spacing["3xl"],
    paddingBottom: theme.spacing.lg,
    paddingTop: theme.spacing["2xl"],
    backgroundColor: theme.colors.scrim,
    gap: 3,
  },
  pillTag: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.scrimInverse,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3,
    borderRadius: theme.radius.pill,
    marginBottom: 2,
  },
  pillTagText: {
    ...theme.typography.caption,
    color: theme.colors.textOnPrimary,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  heroName: {
    ...theme.typography.title1,
    color: theme.colors.textOnPrimary,
    fontWeight: "700",
  },
  heroSubtitle: {
    ...theme.typography.footnote,
    color: theme.colors.textOnPrimary,
    opacity: 0.8,
  },
  // Floating stats + tabs
  floatingGroup: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  statsCard: {
    flexDirection: "row",
    alignItems: "stretch",
    height: 72,
    ...theme.card,
  },
  statCell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
  },
  statCellRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  statContent: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  statChevron: {
    width: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  statDivider: {
    width: theme.hairline,
    marginVertical: theme.spacing.md,
  },
  tabs: {
    marginTop: theme.spacing.xs,
  },
  statValue: {
    ...theme.typography.subhead,
    fontWeight: "600",
  },
  statLabel: {
    ...theme.typography.caption,
  },
  // Content
  headerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  tabContent: {
    flex: 1,
  },
  tabContentInner: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: theme.spacing["3xl"],
  },
  placeholder: {
    alignItems: "center",
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing["3xl"],
  },
  placeholderText: {
    ...theme.typography.footnote,
    textAlign: "center",
  },
  // Collapsed header
  collapsedName: {
    position: "absolute" as const,
    left: 60,
    right: 60,
    height: 36,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  collapsedNameText: {
    ...theme.typography.subhead,
    fontWeight: "600" as const,
    color: theme.colors.textOnPrimary,
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
}));

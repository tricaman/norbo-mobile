import { NorboPressable } from "@/components/CustomPressable";
import { PetCategoryIcon } from "@/components/pets/wizard/PetCategoryIcon";
import { CATEGORY_META } from "@/components/pets/wizard/category-meta";
import { Dropdown } from "@/components/ui/Dropdown";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { QueryBoundary } from "@/components/ui/QueryBoundary";
import { SCREEN_BOTTOM_PADDING } from "@/constants/layout";
import { useMutation } from "@/hooks/useMutation";
import { petsApi } from "@/services/pets.api";
import { queryClient } from "@/app/_layout";
import { PetTimeline } from "@/components/health-timeline/PetTimeline";
import { Sex, type Pet } from "@/types/pet.types";
import { useQuery } from "@tanstack/react-query";
import { differenceInMonths, differenceInYears, parseISO } from "date-fns";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { useTranslation } from "react-i18next";

type PetDetailTab = "timeline" | "photos" | "expenses" | "care";

const HERO_HEIGHT = 280;

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
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [menuVisible, setMenuVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<PetDetailTab>("timeline");

  const meta = CATEGORY_META[pet.category];
  const speciesLabel = pet.speciesLabelFreetext ?? null;

  function ageLabel(): string {
    if (!pet.birthDate) return "";
    const birth = parseISO(pet.birthDate);
    const now = new Date();
    const years = differenceInYears(now, birth);
    if (years >= 1) {
      return `${years} ${t(years === 1 ? "petDetail.ageYear" : "petDetail.ageYears")}`;
    }
    const months = differenceInMonths(now, birth);
    if (months < 1) return "";
    return `${months} ${t(months === 1 ? "petDetail.ageMonth" : "petDetail.ageMonths")}`;
  }

  const age = ageLabel();
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

  const weightLabel = pet.currentWeight
    ? `${pet.currentWeight} ${pet.weightUnit}`
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
    care: { icon: "heart", message: t("petDetail.care.empty") },
  };

  const STATS = [
    {
      icon: "scalemass",
      value: weightLabel,
      label: t("petDetail.stats.weight"),
    },
    { icon: "bell", value: "—", label: t("petDetail.stats.next") },
    { icon: "photo", value: "0", label: t("petDetail.stats.photos") },
  ];

  return (
    <View style={styles.screen}>
      {/* ── Hero ───────────────────────────────────── */}
      <View
        style={[
          styles.hero,
          { height: HERO_HEIGHT + insets.top, backgroundColor: meta.tint },
        ]}
      >
        {pet.photoUrl ? (
          <Image
            source={{ uri: pet.photoUrl }}
            style={styles.heroPhoto}
            contentFit="cover"
          />
        ) : null}

        <View style={styles.heroIconWrapper} pointerEvents="none">
          <PetCategoryIcon
            category={pet.category}
            size={120}
            color="rgba(255,255,255,0.20)"
          />
        </View>

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
          <IconSymbol name="ellipsis" size={20} tintColor="#fff" />
        </NorboPressable>

        <View style={styles.heroOverlay}>
          <View style={styles.pillTag}>
            <Text style={styles.pillTagText} numberOfLines={1}>
              {pillText}
            </Text>
          </View>
          <Text style={styles.heroName}>{pet.name}</Text>
          {subtitle ? (
            <Text style={styles.heroSubtitle}>{subtitle}</Text>
          ) : null}
        </View>
      </View>

      {/* ── Stats ──────────────────────────────────── */}
      <View
        style={[
          styles.statsRow,
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        {STATS.map((stat, i) => (
          <React.Fragment key={stat.label}>
            {i > 0 && (
              <View
                style={[
                  styles.statDivider,
                  { backgroundColor: theme.colors.border },
                ]}
              />
            )}
            <View style={styles.statCell}>
              <IconSymbol
                name={stat.icon}
                size={16}
                tintColor={theme.colors.textSecondary}
              />
              <Text
                style={[styles.statValue, { color: theme.colors.textPrimary }]}
              >
                {stat.value}
              </Text>
              <Text
                style={[styles.statLabel, { color: theme.colors.textTertiary }]}
              >
                {stat.label}
              </Text>
            </View>
          </React.Fragment>
        ))}
      </View>

      {/* ── Tab bar ────────────────────────────────── */}
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <NorboPressable
              key={tab.key}
              style={styles.tabBtn}
              scale="row"
              haptic="light"
              onPress={() => setActiveTab(tab.key)}
            >
              <View style={styles.tabBtnInner}>
                <IconSymbol
                  name={tab.icon}
                  size={13}
                  tintColor={
                    isActive ? theme.colors.primary : theme.colors.textTertiary
                  }
                />
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: isActive
                        ? theme.colors.primary
                        : theme.colors.textSecondary,
                    },
                    isActive && styles.tabLabelActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </View>
              {isActive && (
                <View
                  style={[
                    styles.tabIndicator,
                    { backgroundColor: theme.colors.primary },
                  ]}
                />
              )}
            </NorboPressable>
          );
        })}
      </View>

      {/* ── Tab content ────────────────────────────── */}
      {activeTab === "timeline" ? (
        <View style={styles.tabContent}>
          <PetTimeline petId={petId} />
        </View>
      ) : (
        <ScrollView
          key={activeTab}
          style={styles.tabContent}
          contentContainerStyle={[
            styles.tabContentInner,
            { paddingBottom: SCREEN_BOTTOM_PADDING + insets.bottom },
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
        </ScrollView>
      )}

      <Dropdown
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        items={[
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
        ]}
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
    backgroundColor: "rgba(0,0,0,0.30)",
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
    backgroundColor: "rgba(0,0,0,0.28)",
    gap: 3,
  },
  pillTag: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.22)",
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
  // Stats
  statsRow: {
    flexDirection: "row",
    alignItems: "stretch",
    height: 72,
    borderBottomWidth: theme.hairline,
  },
  statCell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    paddingVertical: theme.spacing.sm,
  },
  statDivider: {
    width: theme.hairline,
    marginVertical: theme.spacing.md,
  },
  statValue: {
    ...theme.typography.subhead,
    fontWeight: "600",
  },
  statLabel: {
    ...theme.typography.caption,
  },
  // Tab bar
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: theme.hairline,
    height: 44,
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  tabBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  tabLabel: {
    ...theme.typography.caption,
  },
  tabLabelActive: {
    fontWeight: "600",
  },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    left: 12,
    right: 12,
    height: 2,
    borderRadius: 1,
  },
  // Content
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
}));

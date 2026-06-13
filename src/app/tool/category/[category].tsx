import { CATEGORY_META } from "@/components/pets/wizard/category-meta";
import { PetCategoryIcon } from "@/components/pets/wizard/PetCategoryIcon";
import { ToolRow } from "@/components/tools/ToolRow";
import { Card } from "@/components/ui/Card";
import { Screen } from "@/components/ui/Screen";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import {
  SingleSelectSheet,
  type SingleSelectOption,
} from "@/components/ui/SingleSelectSheet";
import { SCREEN_BOTTOM_PADDING } from "@/constants/layout";
import { useAvailableTools } from "@/hooks/useTools";
import { petsApi } from "@/services/pets.api";
import { PetCategory, type Pet } from "@/types/pet.types";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

const CATEGORY_VALUES = Object.values(PetCategory) as string[];

/**
 * CategoryToolsScreen — the tools for a single pet category (e.g. "dog tools").
 *
 * A pet chip selects which of the user's same-category pets pre-fills the
 * tools; opening a tool forwards that pet id to the generic tool loader
 * (`/tool/[toolId]`), which already reads `petId` for pre-fill. Data-driven on
 * the category param — no per-category branching.
 */
export default function CategoryToolsScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const router = useRouter();
  const { category: rawCategory, petId } = useLocalSearchParams<{
    category: string;
    petId?: string;
  }>();

  const category = CATEGORY_VALUES.includes(rawCategory)
    ? (rawCategory as PetCategory)
    : null;

  const { data: tools } = useAvailableTools();
  const petsQuery = useQuery({
    queryKey: ["pets"],
    queryFn: () => petsApi.list().then((r) => r.data),
  });
  const pets = petsQuery.data ?? [];

  const categoryTools = (tools ?? []).filter(
    (tool) =>
      category != null &&
      !tool.crossSpecies &&
      tool.categories.includes(category),
  );
  const samePets = category
    ? pets.filter((pet) => pet.category === category)
    : [];

  // Active pet = the one passed in, else the first of this category.
  const [activePetId, setActivePetId] = React.useState<string | null>(
    petId ?? null,
  );
  const activePet: Pet | null =
    samePets.find((p) => p.id === activePetId) ?? samePets[0] ?? null;

  const label = activePet?.subcategoryName ?? (category
    ? t(`petForm.categories.${category}` as never)
    : "");

  const petOptions: SingleSelectOption<string>[] = samePets.map((pet) => ({
    value: pet.id,
    label: pet.name,
    leading: () => <PetInitial name={pet.name} />,
  }));

  return (
    <Screen>
      <ScreenHeader
        title={t("servicesHub.categoryToolsTitle", { label })}
        right={
          category ? (
            <View
              style={[
                styles.headerIcon,
                { backgroundColor: CATEGORY_META[category].tint },
              ]}
            >
              <PetCategoryIcon
                category={category}
                size={18}
                color="rgba(255,255,255,0.92)"
              />
            </View>
          ) : undefined
        }
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {activePet ? (
          <View style={styles.prefillRow}>
            <SingleSelectSheet
              options={petOptions}
              value={activePet.id}
              onChange={setActivePetId}
              title={t("servicesHub.selectPet")}
            />
            <Text style={styles.prefillHint}>
              {t("servicesHub.prefilledTapToEdit")}
            </Text>
          </View>
        ) : null}

        <Card clip>
          {categoryTools.map((tool, i) => (
            <React.Fragment key={tool.id}>
              <ToolRow
                tool={tool}
                onPress={() =>
                  router.push(
                    (activePet
                      ? `/tool/${tool.id}?petId=${activePet.id}`
                      : `/tool/${tool.id}`) as never,
                  )
                }
              />
              {i < categoryTools.length - 1 ? (
                <View style={styles.divider} />
              ) : null}
            </React.Fragment>
          ))}
        </Card>

        <Text style={styles.disclaimer}>
          {t("servicesHub.estimatesDisclaimer")}
        </Text>
      </ScrollView>
    </Screen>
  );
}

/** Compact circular initial — sized to fit the pet-selector chip (36px tall)
 *  and the sheet rows, where a full `Avatar` (≥40px) would overflow. */
function PetInitial({ name }: { name: string }): React.JSX.Element {
  return (
    <View style={styles.petInitial}>
      <Text style={styles.petInitialText}>
        {name.charAt(0).toUpperCase() || "?"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  petInitial: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  petInitialText: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    textTransform: "none",
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing["3xl"],
    paddingTop: theme.spacing.lg,
    paddingBottom: SCREEN_BOTTOM_PADDING,
    gap: theme.spacing.lg,
  },
  prefillRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    flexWrap: "wrap",
  },
  prefillHint: {
    ...theme.typography.footnote,
    color: theme.colors.textTertiary,
    flexShrink: 1,
  },
  divider: {
    height: theme.hairline,
    marginLeft: theme.spacing.xl + 40 + theme.spacing.lg,
    backgroundColor: theme.colors.border,
  },
  disclaimer: {
    ...theme.typography.footnote,
    color: theme.colors.textTertiary,
    textAlign: "center",
    paddingHorizontal: theme.spacing.lg,
  },
}));

import { CategoryToolsCard } from "@/components/tools/CategoryToolsCard";
import { ToolRow } from "@/components/tools/ToolRow";
import { Card } from "@/components/ui/Card";
import { QueryBoundary } from "@/components/ui/QueryBoundary";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { TabScreen } from "@/components/ui/TabScreen";
import { SCREEN_BOTTOM_PADDING } from "@/constants/layout";
import { useAvailableTools } from "@/hooks/useTools";
import { petsApi } from "@/services/pets.api";
import type { Pet, PetCategory } from "@/types/pet.types";
import type { ToolMetadata } from "@/types/tool.types";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

interface CategoryGroup {
  category: PetCategory;
  /** First pet of the category — badges the card and pre-fills its tools. */
  pet: Pet;
  toolCount: number;
}

/**
 * ServicesTab — entry point of the Services Tool System.
 *
 * Tools are grouped instead of listed flat: a "for your pets" section with one
 * card per owned pet category (opening that category's tools, pre-filled from
 * the pet) and a "for everyone" section with the cross-species tools, always
 * visible — even with no pet registered.
 */
export default function ServicesTab(): React.JSX.Element {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const router = useRouter();
  const query = useAvailableTools();
  // Pets power the category groups. Same query key as the rest of the app, so
  // it's typically already warm from the Home tab (no extra fetch on entry).
  const petsQuery = useQuery({
    queryKey: ["pets"],
    queryFn: () => petsApi.list().then((r) => r.data),
  });
  const pets = petsQuery.data ?? [];

  return (
    <TabScreen title={t("tabs.services")}>
      <QueryBoundary query={query} EmptyComponent={ToolsEmpty}>
        {(tools) => {
          const genericTools = tools.filter((tool) => tool.crossSpecies);
          const groups = buildCategoryGroups(tools, pets);
          const isEmpty = groups.length === 0 && genericTools.length === 0;

          return (
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={query.isRefetching || petsQuery.isRefetching}
                  onRefresh={() => {
                    void query.refetch();
                    void petsQuery.refetch();
                  }}
                  tintColor={theme.colors.primary}
                  colors={[theme.colors.primary]}
                />
              }
            >
              <Text style={styles.subtitle}>{t("servicesHub.subtitle")}</Text>

              {groups.length > 0 ? (
                <View style={styles.section}>
                  <SectionLabel>{t("servicesHub.forYourPets")}</SectionLabel>
                  <View style={styles.cards}>
                    {groups.map((group) => (
                      <CategoryToolsCard
                        key={group.category}
                        category={group.category}
                        label={
                          group.pet.subcategoryName ??
                          t(`petForm.categories.${group.category}` as never)
                        }
                        toolCount={group.toolCount}
                        petName={group.pet.name}
                        onPress={() =>
                          router.push(
                            `/tool/category/${group.category}?petId=${group.pet.id}` as never,
                          )
                        }
                      />
                    ))}
                  </View>
                </View>
              ) : null}

              {genericTools.length > 0 ? (
                <View style={styles.section}>
                  <View style={styles.everyoneHeader}>
                    <SectionLabel>{t("servicesHub.forEveryone")}</SectionLabel>
                    <View style={styles.hint}>
                      <View style={styles.hintDot} />
                      <Text style={styles.hintText}>
                        {t("servicesHub.worksWithoutProfile")}
                      </Text>
                    </View>
                  </View>
                  <Card clip>
                    {genericTools.map((tool, i) => (
                      <React.Fragment key={tool.id}>
                        <ToolRow
                          tool={tool}
                          onPress={() =>
                            router.push(`/tool/${tool.id}` as never)
                          }
                          right={
                            <Text style={styles.allPets}>
                              {t("servicesHub.allPets")}
                            </Text>
                          }
                        />
                        {i < genericTools.length - 1 ? (
                          <View style={styles.divider} />
                        ) : null}
                      </React.Fragment>
                    ))}
                  </Card>
                </View>
              ) : null}

              {isEmpty && !petsQuery.isPending ? <ToolsEmpty /> : null}
            </ScrollView>
          );
        }}
      </QueryBoundary>
    </TabScreen>
  );
}

/**
 * Builds one group per owned pet category that has at least one category tool,
 * in order of first pet appearance. The first pet of each category is the
 * representative used for the badge and tool pre-fill.
 */
function buildCategoryGroups(
  tools: ToolMetadata[],
  pets: Pet[],
): CategoryGroup[] {
  const categoryTools = tools.filter((tool) => !tool.crossSpecies);
  const seen = new Set<PetCategory>();
  const groups: CategoryGroup[] = [];

  for (const pet of pets) {
    if (seen.has(pet.category)) continue;
    seen.add(pet.category);
    const toolCount = categoryTools.filter((tool) =>
      tool.categories.includes(pet.category),
    ).length;
    if (toolCount > 0) {
      groups.push({ category: pet.category, pet, toolCount });
    }
  }
  return groups;
}

function ToolsEmpty(): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>{t("servicesHub.empty")}</Text>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing["3xl"],
    paddingTop: theme.spacing.sm,
    paddingBottom: SCREEN_BOTTOM_PADDING,
    gap: theme.spacing["2xl"],
  },
  subtitle: {
    ...theme.typography.footnote,
    color: theme.colors.textSecondary,
  },
  section: {
    gap: theme.spacing.sm,
  },
  cards: {
    gap: theme.spacing.sm,
  },
  everyoneHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  hint: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    paddingBottom: theme.spacing.xs,
  },
  hintDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.accent,
  },
  hintText: {
    ...theme.typography.footnote,
    color: theme.colors.textTertiary,
  },
  allPets: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
    textTransform: "lowercase",
  },
  divider: {
    height: theme.hairline,
    marginLeft: theme.spacing.xl + 40 + theme.spacing.lg,
    backgroundColor: theme.colors.border,
  },
  empty: {
    alignItems: "center",
    paddingTop: theme.spacing["3xl"],
  },
  emptyText: {
    ...theme.typography.footnote,
    color: theme.colors.textSecondary,
  },
}));

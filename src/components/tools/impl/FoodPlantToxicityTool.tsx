import { ToolCategoryPicker } from "@/components/tools/ToolCategoryPicker";
import { ToolSection } from "@/components/tools/ui";
import { QueryBoundary } from "@/components/ui/QueryBoundary";
import { careKnowledgeApi } from "@/services/care-knowledge.api";
import type { ToxicityItem, ToxicityRisk } from "@/types/care-knowledge.types";
import { PetCategory } from "@/types/pet.types";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, Text, TextInput, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import type { ToolComponent } from "../tool-component";

function riskColor(risk: ToxicityRisk, theme: ReturnType<typeof useUnistyles>["theme"]): string {
  if (risk === "TOXIC") return theme.colors.error;
  if (risk === "CAUTION") return theme.colors.warning;
  return theme.colors.primary;
}

function findMatch(items: ToxicityItem[], query: string): ToxicityItem | null {
  const q = query.toLowerCase().trim();
  if (!q) return null;
  return (
    items.find((it) => it.names.some((n) => n.includes(q) || q.includes(n))) ??
    null
  );
}

/**
 * Shared toxicity view. Reused by the cross-species food-plant-toxicity tool
 * and the cat "plants" quick-access (pre-filtered to cats, picker hidden) — so
 * the component is not duplicated.
 */
export function FoodPlantToxicityView({
  defaultCategory,
  showCategoryPicker,
}: {
  defaultCategory: PetCategory;
  showCategoryPicker: boolean;
}): React.JSX.Element {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const [category, setCategory] = React.useState<PetCategory>(defaultCategory);
  const [query, setQuery] = React.useState("");

  const toxicityQuery = useQuery({
    queryKey: ["care-knowledge", "toxicity", category],
    queryFn: () => careKnowledgeApi.toxicity(category).then((r) => r.data),
  });

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {showCategoryPicker ? (
        <ToolCategoryPicker value={category} onChange={setCategory} />
      ) : null}

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder={t("tools.foodPlantToxicity.placeholder")}
        placeholderTextColor={theme.colors.textTertiary}
        style={styles.input}
        autoCorrect={false}
      />

      <QueryBoundary query={toxicityQuery}>
        {(items) => {
          const match = findMatch(items, query);
          return (
            <ToolSection label={t("tools.foodPlantToxicity.result")}>
              {query.trim() === "" ? (
                <Text style={styles.hint}>
                  {t("tools.foodPlantToxicity.hint")}
                </Text>
              ) : match ? (
                <View style={styles.resultCard}>
                  <Text
                    style={[
                      styles.riskLabel,
                      { color: riskColor(match.risk, theme) },
                    ]}
                  >
                    {t(`tools.foodPlantToxicity.risk.${match.risk}`)}
                  </Text>
                  <Text style={styles.note}>{t(match.noteKey as never)}</Text>
                </View>
              ) : (
                <Text style={styles.hint}>
                  {t("tools.foodPlantToxicity.unknown")}
                </Text>
              )}
              <Text style={styles.disclaimer}>
                {t("tools.foodPlantToxicity.disclaimer")}
              </Text>
            </ToolSection>
          );
        }}
      </QueryBoundary>
    </ScrollView>
  );
}

const FoodPlantToxicityTool: ToolComponent<"food-plant-toxicity"> = ({
  pet,
}) => (
  <FoodPlantToxicityView
    defaultCategory={pet?.category ?? PetCategory.MAMMAL_DOG}
    showCategoryPicker
  />
);

export default FoodPlantToxicityTool;

const styles = StyleSheet.create((theme) => ({
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    paddingBottom: theme.spacing["4xl"],
  },
  input: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.pill,
  },
  resultCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: theme.hairline,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    gap: theme.spacing.xs,
  },
  riskLabel: {
    ...theme.monoTypography.labelMono,
  },
  note: {
    ...theme.typography.footnote,
    color: theme.colors.textSecondary,
  },
  hint: {
    ...theme.typography.footnote,
    color: theme.colors.textTertiary,
  },
  disclaimer: {
    ...theme.typography.caption,
    color: theme.colors.error,
  },
}));

import { SmallMammalSpeciesPicker } from "@/components/tools/SmallMammalSpeciesPicker";
import { ToolResultCard, ToolSection } from "@/components/tools/ui";
import { QueryBoundary } from "@/components/ui/QueryBoundary";
import { matchSmallMammalSpecies, useSmallMammals } from "@/hooks/useDogs";
import { careKnowledgeApi } from "@/services/care-knowledge.api";
import type { SafeTemperature } from "@/types/care-knowledge.types";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { ToolComponent } from "../tool-component";

const SafeTemperaturesSmallTool: ToolComponent<"safe-temperatures-small"> = () => {
  const { t } = useTranslation();
  const { smallMammals } = useSmallMammals();
  const [species, setSpecies] = React.useState<string | null>(null);
  const effective =
    species ??
    matchSmallMammalSpecies(smallMammals[0]?.speciesLabelFreetext ?? null);

  const query = useQuery({
    queryKey: ["care-knowledge", "small-mammal-temperatures", effective],
    queryFn: () =>
      careKnowledgeApi.smallMammalTemperatures(effective).then((r) => r.data),
  });

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <SmallMammalSpeciesPicker value={effective} onChange={setSpecies} />

      <QueryBoundary query={query}>
        {(temp: SafeTemperature) => (
          <>
            <ToolSection label={t("tools.safeTemperaturesSmall.safeRange")}>
              <ToolResultCard
                label={t(temp.nameKey as never)}
                value={`${temp.minC}–${temp.maxC}`}
                unit="°C"
              />
              <ToolResultCard
                label={t("tools.safeTemperaturesSmall.heatRisk")}
                value={`≥ ${temp.heatRiskC}`}
                unit="°C"
              />
              {temp.torporRiskC != null ? (
                <ToolResultCard
                  label={t("tools.safeTemperaturesSmall.torporRisk")}
                  value={`≤ ${temp.torporRiskC}`}
                  unit="°C"
                />
              ) : null}
            </ToolSection>
            <View style={styles.notes}>
              {temp.behaviorNoteKeys.map((k) => (
                <Text key={k} style={styles.note}>
                  • {t(k as never)}
                </Text>
              ))}
            </View>
          </>
        )}
      </QueryBoundary>
    </ScrollView>
  );
};

export default SafeTemperaturesSmallTool;

const styles = StyleSheet.create((theme) => ({
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    paddingBottom: theme.spacing["4xl"],
  },
  notes: { gap: theme.spacing.xs },
  note: { ...theme.typography.footnote, color: theme.colors.textSecondary },
}));

import { SmallMammalSpeciesPicker } from "@/components/tools/SmallMammalSpeciesPicker";
import { ToolNumberField, ToolResultCard, ToolSection } from "@/components/tools/ui";
import { QueryBoundary } from "@/components/ui/QueryBoundary";
import { matchSmallMammalSpecies, useSmallMammals } from "@/hooks/useDogs";
import { careKnowledgeApi } from "@/services/care-knowledge.api";
import type { EnclosureGuideline } from "@/types/care-knowledge.types";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { ToolComponent } from "../tool-component";

const SmallMammalEnclosureTool: ToolComponent<"small-mammal-enclosure"> = () => {
  const { t } = useTranslation();
  const { smallMammals } = useSmallMammals();
  const [species, setSpecies] = React.useState<string | null>(null);
  const effective =
    species ??
    matchSmallMammalSpecies(smallMammals[0]?.speciesLabelFreetext ?? null);
  const [count, setCount] = React.useState<number | null>(
    smallMammals.length > 0 ? smallMammals.length : 1,
  );

  const query = useQuery({
    queryKey: ["care-knowledge", "small-mammal-enclosure", effective],
    queryFn: () =>
      careKnowledgeApi.smallMammalEnclosure(effective).then((r) => r.data),
  });

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <SmallMammalSpeciesPicker value={effective} onChange={setSpecies} />
      <ToolNumberField
        label={t("tools.smallMammalEnclosure.count")}
        value={count}
        onChangeValue={(v) => setCount(v == null ? null : Math.round(v))}
        placeholder="1"
      />

      <QueryBoundary query={query}>
        {(e: EnclosureGuideline) => {
          const n = count != null && count > 0 ? count : 1;
          const areaCm2 = e.minFloorAreaCm2 + (n - 1) * e.perAdditionalAreaCm2;
          return (
            <ToolSection label={t("tools.smallMammalEnclosure.result")}>
              <ToolResultCard
                label={t("tools.smallMammalEnclosure.floorArea")}
                value={`${(areaCm2 / 10000).toFixed(2)}`}
                unit="m²"
              />
              <ToolResultCard
                label={t("tools.smallMammalEnclosure.minHeight")}
                value={`≥ ${e.minHeightCm}`}
                unit="cm"
              />
              <View style={styles.notes}>
                {e.enrichmentNoteKeys.map((k) => (
                  <Text key={k} style={styles.note}>
                    • {t(k as never)}
                  </Text>
                ))}
              </View>
            </ToolSection>
          );
        }}
      </QueryBoundary>
    </ScrollView>
  );
};

export default SmallMammalEnclosureTool;

const styles = StyleSheet.create((theme) => ({
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    paddingBottom: theme.spacing["4xl"],
  },
  notes: { gap: theme.spacing.xs },
  note: { ...theme.typography.footnote, color: theme.colors.textSecondary },
}));

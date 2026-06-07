import { ToolNumberField, ToolResultCard, ToolSection } from "@/components/tools/ui";
import { QueryBoundary } from "@/components/ui/QueryBoundary";
import { useCats } from "@/hooks/useDogs";
import { careKnowledgeApi } from "@/services/care-knowledge.api";
import type { CatLitterGuidance } from "@/types/care-knowledge.types";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { ToolComponent } from "../tool-component";

const CatLitterCalculatorTool: ToolComponent<"cat-litter-calculator"> = ({
  initialInputs,
}) => {
  const { t } = useTranslation();
  const { cats } = useCats();
  const [catCount, setCatCount] = React.useState<number | null>(
    initialInputs?.catCount ?? null,
  );

  // Pre-fill from the number of registered cats (override-able).
  const seeded = React.useRef(false);
  React.useEffect(() => {
    if (!seeded.current && catCount == null && cats.length > 0) {
      seeded.current = true;
      setCatCount(cats.length);
    }
  }, [cats.length, catCount]);

  const query = useQuery({
    queryKey: ["care-knowledge", "cat-litter"],
    queryFn: () => careKnowledgeApi.catLitter().then((r) => r.data),
  });

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <ToolNumberField
        label={t("tools.catLitterCalculator.cats")}
        value={catCount}
        onChangeValue={(v) => setCatCount(v == null ? null : Math.round(v))}
        placeholder="1"
      />

      <QueryBoundary query={query}>
        {(guidance: CatLitterGuidance) => {
          const boxes = catCount != null && catCount > 0 ? catCount + 1 : null;
          return (
            <ToolSection label={t("tools.catLitterCalculator.result")}>
              {boxes != null ? (
                <ToolResultCard
                  label={t("tools.catLitterCalculator.boxes")}
                  value={String(boxes)}
                  unit={t("tools.catLitterCalculator.boxesUnit")}
                  caption={t("tools.catLitterCalculator.rule")}
                />
              ) : null}
              <ToolResultCard
                label={t("tools.catLitterCalculator.minSize")}
                value={`≥ ${guidance.recommendedBoxLengthCm}`}
                unit="cm"
              />
              <View style={styles.notes}>
                {guidance.noteKeys.map((k) => (
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

export default CatLitterCalculatorTool;

const styles = StyleSheet.create((theme) => ({
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    paddingBottom: theme.spacing["4xl"],
  },
  notes: { gap: theme.spacing.xs, marginTop: theme.spacing.xs },
  note: { ...theme.typography.footnote, color: theme.colors.textSecondary },
}));

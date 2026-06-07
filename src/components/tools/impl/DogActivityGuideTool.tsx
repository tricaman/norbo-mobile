import { ToolResultCard, ToolSection, ToolUnitToggle } from "@/components/tools/ui";
import { QueryBoundary } from "@/components/ui/QueryBoundary";
import { ageMonthsFrom, useDogs } from "@/hooks/useDogs";
import { careKnowledgeApi } from "@/services/care-knowledge.api";
import type {
  DogActivityGuideline,
  DogAgeBand,
  DogSize,
} from "@/types/care-knowledge.types";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, Text } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { ToolComponent } from "../tool-component";

const SIZES: DogSize[] = ["TOY", "SMALL", "MEDIUM", "LARGE", "GIANT"];

function bandFromMonths(months: number | null): DogAgeBand {
  if (months == null) return "ADULT";
  if (months < 12) return "PUPPY";
  if (months >= 84) return "SENIOR";
  return "ADULT";
}

const DogActivityGuideTool: ToolComponent<"dog-activity-guide"> = () => {
  const { t } = useTranslation();
  const { dogs } = useDogs();
  const firstDog = dogs[0] ?? null;

  const [size, setSize] = React.useState<DogSize>("MEDIUM");
  const [ageBand, setAgeBand] = React.useState<DogAgeBand>(() =>
    bandFromMonths(ageMonthsFrom(firstDog?.birthDate ?? null)),
  );

  const query = useQuery({
    queryKey: ["care-knowledge", "dog-activity"],
    queryFn: () => careKnowledgeApi.dogActivity().then((r) => r.data),
  });

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <ToolSection label={t("tools.dogActivityGuide.size")}>
        <ToolUnitToggle<DogSize>
          options={SIZES.map((s) => ({
            value: s,
            label: t(`tools.dogActivityGuide.sizes.${s}` as never),
          }))}
          value={size}
          onChange={setSize}
        />
      </ToolSection>
      <ToolSection label={t("tools.dogActivityGuide.age")}>
        <ToolUnitToggle<DogAgeBand>
          options={[
            { value: "PUPPY", label: t("tools.dogActivityGuide.bands.PUPPY") },
            { value: "ADULT", label: t("tools.dogActivityGuide.bands.ADULT") },
            { value: "SENIOR", label: t("tools.dogActivityGuide.bands.SENIOR") },
          ]}
          value={ageBand}
          onChange={setAgeBand}
        />
      </ToolSection>

      <QueryBoundary query={query}>
        {(rows: DogActivityGuideline[]) => {
          const g = rows.find((r) => r.size === size && r.ageBand === ageBand);
          if (!g) return <Text style={styles.hint}>—</Text>;
          return (
            <ToolResultCard
              label={t("tools.dogActivityGuide.result")}
              value={`${g.minMinutes}–${g.maxMinutes}`}
              unit={t("tools.dogActivityGuide.minPerDay")}
              caption={`${t("tools.dogActivityGuide.intensity")}: ${t(`tools.dogActivityGuide.intensities.${g.intensity}` as never)}`}
            />
          );
        }}
      </QueryBoundary>
    </ScrollView>
  );
};

export default DogActivityGuideTool;

const styles = StyleSheet.create((theme) => ({
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    paddingBottom: theme.spacing["4xl"],
  },
  hint: {
    ...theme.typography.footnote,
    color: theme.colors.textTertiary,
  },
}));

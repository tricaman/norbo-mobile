import { NorboPressable } from "@/components/CustomPressable";
import { ToolResultCard, ToolSection } from "@/components/tools/ui";
import { QueryBoundary } from "@/components/ui/QueryBoundary";
import { careKnowledgeApi } from "@/services/care-knowledge.api";
import type {
  EnvRange,
  ReptileEnvironmentProfile,
} from "@/types/care-knowledge.types";
import { PetCategory, type Pet } from "@/types/pet.types";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import type { ToolComponent } from "../tool-component";

const range = (r: EnvRange): string => `${r.min}–${r.max}`;

/** Best-effort: match the pet's species text against a profile's aliases. */
function deriveProfileId(
  profiles: ReptileEnvironmentProfile[],
  pet: Pet | null,
): string | null {
  if (!pet || pet.category !== PetCategory.REPTILE) return null;
  const hint = pet.speciesLabelFreetext?.toLowerCase().trim();
  if (!hint) return null;
  const match = profiles.find((p) =>
    p.aliases.some((a) => hint.includes(a) || a.includes(hint)),
  );
  return match?.id ?? null;
}

/**
 * Reptile environment guide — structured care CONTENT (no calculation, no
 * persistence). Reads curated target temps/humidity from the care-knowledge
 * module by selected profile, pre-selected from the pet's species when set.
 */
const ReptileGuideTool: ToolComponent<"reptile-environment-guide"> = ({
  pet,
}) => {
  const query = useQuery({
    queryKey: ["care-knowledge", "reptile-environment"],
    queryFn: () => careKnowledgeApi.reptileEnvironment().then((r) => r.data),
  });

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <QueryBoundary query={query}>
        {(profiles) => <Guide profiles={profiles} pet={pet} />}
      </QueryBoundary>
    </ScrollView>
  );
};

function Guide({
  profiles,
  pet,
}: {
  profiles: ReptileEnvironmentProfile[];
  pet: Pet | null;
}): React.JSX.Element {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const [picked, setPicked] = React.useState<string | null>(null);
  const selectedId =
    picked ?? deriveProfileId(profiles, pet) ?? profiles[0]?.id ?? null;
  const selected = profiles.find((p) => p.id === selectedId) ?? null;

  return (
    <View style={styles.guide}>
      <Text style={styles.pickerLabel}>
        {t("tools.reptileEnvironmentGuide.selectProfile")}
      </Text>
      <View style={styles.picker}>
        {profiles.map((p) => {
          const isSelected = p.id === selectedId;
          return (
            <NorboPressable
              key={p.id}
              scale="row"
              haptic="light"
              onPress={() => setPicked(p.id)}
              style={[
                styles.profileRow,
                isSelected && {
                  backgroundColor: theme.colors.primarySoft,
                  borderColor: theme.colors.primary,
                },
              ]}
            >
              <Text
                style={[
                  styles.profileName,
                  {
                    color: isSelected
                      ? theme.colors.textPrimary
                      : theme.colors.textSecondary,
                  },
                ]}
              >
                {t(p.nameKey as never)}
              </Text>
            </NorboPressable>
          );
        })}
      </View>

      {selected ? (
        <>
          <ToolSection label={t("tools.reptileEnvironmentGuide.temperature")}>
            <ToolResultCard
              label={t("tools.reptileEnvironmentGuide.basking")}
              value={range(selected.baskingTempC)}
              unit="°C"
            />
            <ToolResultCard
              label={t("tools.reptileEnvironmentGuide.cool")}
              value={range(selected.coolTempC)}
              unit="°C"
            />
          </ToolSection>
          <ToolSection label={t("tools.reptileEnvironmentGuide.humidity")}>
            <ToolResultCard
              label={t("tools.reptileEnvironmentGuide.humidity")}
              value={range(selected.humidityPct)}
              unit="%"
              caption={t("tools.reptileEnvironmentGuide.disclaimer")}
            />
          </ToolSection>
        </>
      ) : null}
    </View>
  );
}

export default ReptileGuideTool;

const styles = StyleSheet.create((theme) => ({
  content: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing["4xl"],
  },
  guide: {
    gap: theme.spacing.sm,
  },
  pickerLabel: {
    ...theme.typography.footnote,
    color: theme.colors.primary,
    textTransform: "lowercase",
    letterSpacing: 1,
    paddingHorizontal: theme.spacing.xs,
  },
  picker: {
    gap: theme.spacing.sm,
  },
  profileRow: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    ...theme.card,
  },
  profileName: {
    ...theme.typography.subhead,
  },
}));

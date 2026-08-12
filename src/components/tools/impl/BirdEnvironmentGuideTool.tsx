import { NorboPressable } from "@/components/CustomPressable";
import { ToolResultCard, ToolSection } from "@/components/tools/ui";
import { QueryBoundary } from "@/components/ui/QueryBoundary";
import { careKnowledgeApi } from "@/services/care-knowledge.api";
import type {
  BirdEnvironmentProfile,
  EnvRange,
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
  profiles: BirdEnvironmentProfile[],
  pet: Pet | null,
): string | null {
  if (!pet || pet.category !== PetCategory.BIRD) return null;
  const hint = pet.speciesLabelFreetext?.toLowerCase().trim();
  if (!hint) return null;
  const match = profiles.find((p) =>
    p.aliases.some((a) => hint.includes(a) || a.includes(hint)),
  );
  return match?.id ?? null;
}

/**
 * Bird environment guide — structured care CONTENT (no calculation, no
 * persistence). Reads curated temperature/humidity/light targets and home
 * hazards from the care-knowledge module by selected species group,
 * pre-selected from the pet's species when set.
 */
const BirdEnvironmentGuideTool: ToolComponent<"bird-environment-guide"> = ({
  pet,
}) => {
  const query = useQuery({
    queryKey: ["care-knowledge", "bird-environment"],
    queryFn: () => careKnowledgeApi.birdEnvironment().then((r) => r.data),
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
  profiles: BirdEnvironmentProfile[];
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
        {t("tools.birdEnvironmentGuide.selectProfile")}
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
          <ToolSection label={t("tools.birdEnvironmentGuide.temperature")}>
            <ToolResultCard
              label={t("tools.birdEnvironmentGuide.temperature")}
              value={range(selected.tempC)}
              unit="°C"
            />
          </ToolSection>
          <ToolSection label={t("tools.birdEnvironmentGuide.humidity")}>
            <ToolResultCard
              label={t("tools.birdEnvironmentGuide.humidity")}
              value={range(selected.humidityPct)}
              unit="%"
            />
          </ToolSection>
          <ToolSection>
            <ToolResultCard
              label={t("tools.birdEnvironmentGuide.daylight")}
              value={range(selected.daylightHours)}
              unit="h"
            />
            <ToolResultCard
              label={t("tools.birdEnvironmentGuide.sleep")}
              value={range(selected.sleepHours)}
              unit="h"
            />
          </ToolSection>
          <ToolSection label={t("tools.birdEnvironmentGuide.hazards")}>
            <View style={styles.hazards}>
              {selected.hazardKeys.map((k) => (
                <Text key={k} style={styles.hazard}>
                  • {t(k as never)}
                </Text>
              ))}
              <Text style={styles.disclaimer}>
                {t("tools.birdEnvironmentGuide.disclaimer")}
              </Text>
            </View>
          </ToolSection>
        </>
      ) : null}
    </View>
  );
}

export default BirdEnvironmentGuideTool;

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
  hazards: { gap: theme.spacing.xs },
  hazard: { ...theme.typography.footnote, color: theme.colors.error },
  disclaimer: { ...theme.typography.caption, color: theme.colors.textTertiary },
}));

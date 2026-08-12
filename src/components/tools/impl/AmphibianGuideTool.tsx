import { NorboPressable } from "@/components/CustomPressable";
import { ToolResultCard, ToolSection } from "@/components/tools/ui";
import { QueryBoundary } from "@/components/ui/QueryBoundary";
import { careKnowledgeApi } from "@/services/care-knowledge.api";
import type {
  AmphibianEnvironmentProfile,
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
  profiles: AmphibianEnvironmentProfile[],
  pet: Pet | null,
): string | null {
  if (!pet || pet.category !== PetCategory.AMPHIBIAN) return null;
  const hint = pet.speciesLabelFreetext?.toLowerCase().trim();
  if (!hint) return null;
  const match = profiles.find((p) =>
    p.aliases.some((a) => hint.includes(a) || a.includes(hint)),
  );
  return match?.id ?? null;
}

/**
 * Amphibian environment guide — structured care CONTENT (no calculation, no
 * persistence). Reads curated water/air temps, humidity and water-preparation
 * notes from the care-knowledge module by selected profile, pre-selected from
 * the pet's species when set.
 */
const AmphibianGuideTool: ToolComponent<"amphibian-environment-guide"> = ({
  pet,
}) => {
  const query = useQuery({
    queryKey: ["care-knowledge", "amphibian-environment"],
    queryFn: () => careKnowledgeApi.amphibianEnvironment().then((r) => r.data),
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
  profiles: AmphibianEnvironmentProfile[];
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
        {t("tools.amphibianEnvironmentGuide.selectProfile")}
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
              <Text style={styles.profileHabitat}>
                {t(`tools.amphibianEnvironmentGuide.habitat.${p.habitat}` as never)}
              </Text>
            </NorboPressable>
          );
        })}
      </View>

      {selected ? (
        <>
          <ToolSection>
            {selected.waterTempC ? (
              <ToolResultCard
                label={t("tools.amphibianEnvironmentGuide.waterTemp")}
                value={range(selected.waterTempC)}
                unit="°C"
              />
            ) : null}
            {selected.airTempC ? (
              <ToolResultCard
                label={t("tools.amphibianEnvironmentGuide.airTemp")}
                value={range(selected.airTempC)}
                unit="°C"
              />
            ) : null}
            {selected.humidityPct ? (
              <ToolResultCard
                label={t("tools.amphibianEnvironmentGuide.humidity")}
                value={range(selected.humidityPct)}
                unit="%"
              />
            ) : null}
          </ToolSection>
          {selected.waterNoteKeys.length > 0 ? (
            <ToolSection label={t("tools.amphibianEnvironmentGuide.water")}>
              <View style={styles.notes}>
                {selected.waterNoteKeys.map((k) => (
                  <Text key={k} style={styles.note}>
                    • {t(k as never)}
                  </Text>
                ))}
              </View>
            </ToolSection>
          ) : null}
          <ToolSection label={t("tools.amphibianEnvironmentGuide.tank")}>
            <Text style={styles.note}>{t(selected.tankNoteKey as never)}</Text>
            <Text style={styles.disclaimer}>
              {t("tools.amphibianEnvironmentGuide.disclaimer")}
            </Text>
          </ToolSection>
        </>
      ) : null}
    </View>
  );
}

export default AmphibianGuideTool;

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
    gap: theme.spacing.xs,
    ...theme.card,
  },
  profileName: {
    ...theme.typography.subhead,
  },
  profileHabitat: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
  },
  notes: { gap: theme.spacing.xs },
  note: { ...theme.typography.footnote, color: theme.colors.textSecondary },
  disclaimer: { ...theme.typography.caption, color: theme.colors.textTertiary },
}));

import { ToolSection, ToolUnitToggle } from "@/components/tools/ui";
import { QueryBoundary } from "@/components/ui/QueryBoundary";
import { ageMonthsFrom, useDogs } from "@/hooks/useDogs";
import { careKnowledgeApi } from "@/services/care-knowledge.api";
import type { DogSize, PuppyMilestone } from "@/types/care-knowledge.types";
import { type Pet } from "@/types/pet.types";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import type { ToolComponent } from "../tool-component";

const SIZES: DogSize[] = ["TOY", "SMALL", "MEDIUM", "LARGE", "GIANT"];

/** Eligible: dogs with a birth date and under 24 months. */
function isEligible(pet: Pet): boolean {
  const m = ageMonthsFrom(pet.birthDate);
  return m != null && m < 24;
}

const PuppyMilestoneTrackerTool: ToolComponent<"puppy-milestone-tracker"> = () => {
  const { t } = useTranslation();
  const { dogs, isPending } = useDogs();
  const puppies = dogs.filter(isEligible);
  const [puppyId, setPuppyId] = React.useState<string | null>(null);
  const selected = puppies.find((p) => p.id === puppyId) ?? puppies[0] ?? null;
  const [size, setSize] = React.useState<DogSize>("MEDIUM");

  const query = useQuery({
    queryKey: ["care-knowledge", "puppy-milestones", size],
    queryFn: () => careKnowledgeApi.puppyMilestones(size).then((r) => r.data),
    enabled: selected != null,
  });

  if (!isPending && puppies.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.hint}>{t("tools.puppyMilestoneTracker.noPuppies")}</Text>
      </View>
    );
  }

  const ageWeeks =
    selected?.birthDate != null
      ? Math.floor(
          (Date.now() - new Date(selected.birthDate).getTime()) /
            (1000 * 60 * 60 * 24 * 7),
        )
      : 0;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {puppies.length > 1 ? (
        <ToolUnitToggle<string>
          options={puppies.map((p) => ({ value: p.id, label: p.name }))}
          value={selected?.id ?? ""}
          onChange={setPuppyId}
        />
      ) : null}

      <ToolSection label={t("tools.puppyMilestoneTracker.size")}>
        <ToolUnitToggle<DogSize>
          options={SIZES.map((s) => ({
            value: s,
            label: t(`tools.dogActivityGuide.sizes.${s}` as never),
          }))}
          value={size}
          onChange={setSize}
        />
      </ToolSection>

      <QueryBoundary query={query}>
        {(milestones: PuppyMilestone[]) => (
          <View style={styles.timeline}>
            {milestones.map((m) => (
              <MilestoneRow key={m.nameKey} milestone={m} ageWeeks={ageWeeks} />
            ))}
          </View>
        )}
      </QueryBoundary>
    </ScrollView>
  );
};

function MilestoneRow({
  milestone,
  ageWeeks,
}: {
  milestone: PuppyMilestone;
  ageWeeks: number;
}): React.JSX.Element {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const status =
    ageWeeks >= milestone.toWeeks
      ? "passed"
      : ageWeeks < milestone.fromWeeks
        ? "upcoming"
        : "current";
  const color =
    status === "passed"
      ? theme.colors.primary
      : status === "current"
        ? theme.colors.warning
        : theme.colors.textTertiary;

  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <View style={styles.rowText}>
        <Text style={styles.name}>{t(milestone.nameKey as never)}</Text>
        <Text style={styles.weeks}>
          {t("tools.puppyMilestoneTracker.weeks", {
            from: String(milestone.fromWeeks),
            to: String(milestone.toWeeks),
          })}{" "}
          · {t(`tools.puppyMilestoneTracker.status.${status}` as never)}
        </Text>
      </View>
    </View>
  );
}

export default PuppyMilestoneTrackerTool;

const styles = StyleSheet.create((theme) => ({
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    paddingBottom: theme.spacing["4xl"],
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: theme.spacing.xl },
  timeline: { gap: theme.spacing.md },
  row: { flexDirection: "row", alignItems: "center", gap: theme.spacing.md },
  dot: { width: 10, height: 10, borderRadius: 5 },
  rowText: { flex: 1, gap: 2 },
  name: { ...theme.typography.subhead, color: theme.colors.textPrimary },
  weeks: { ...theme.typography.footnote, color: theme.colors.textSecondary },
  hint: { ...theme.typography.footnote, color: theme.colors.textTertiary, textAlign: "center" },
}));

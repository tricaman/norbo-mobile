import { NorboPressable } from "@/components/CustomPressable";
import { ToolResultCard, ToolSection, ToolUnitToggle } from "@/components/tools/ui";
import { QueryBoundary } from "@/components/ui/QueryBoundary";
import { useDebounce } from "@/hooks/useDebounce";
import { useDogs } from "@/hooks/useDogs";
import { useWeightHistory } from "@/hooks/useWeightHistory";
import { careKnowledgeApi } from "@/services/care-knowledge.api";
import type { ServiceToolInput } from "@/shared/services-contract";
import type { DogBreedStandard, WeightRange } from "@/types/care-knowledge.types";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import type { ToolComponent } from "../tool-component";

type Inputs = ServiceToolInput<"dog-ideal-weight">;
type Sex = Inputs["sex"];

function rangeForSex(breed: DogBreedStandard, sex: Sex): WeightRange {
  if (sex === "MALE") return breed.male;
  if (sex === "FEMALE") return breed.female;
  return {
    min: Math.min(breed.male.min, breed.female.min),
    max: Math.max(breed.male.max, breed.female.max),
  };
}

const DogIdealWeightTool: ToolComponent<"dog-ideal-weight"> = ({
  initialInputs,
  onInputsChange,
}) => {
  const { t } = useTranslation();
  const { dogs } = useDogs();
  const [dogId, setDogId] = React.useState<string | null>(null);
  const selectedDog = dogs.find((d) => d.id === dogId) ?? dogs[0] ?? null;

  const [breedId, setBreedId] = React.useState<string>(
    initialInputs?.breedId ?? "size:MEDIUM",
  );
  const [sex, setSex] = React.useState<Sex>(
    initialInputs?.sex ?? (selectedDog?.sex as Sex) ?? "UNKNOWN",
  );

  const { latest } = useWeightHistory(selectedDog?.id ?? "");
  const currentKg =
    latest != null ? Math.round((latest.weightMg / 1_000_000) * 10) / 10 : null;

  const breedsQuery = useQuery({
    queryKey: ["care-knowledge", "dog-breeds"],
    queryFn: () => careKnowledgeApi.dogBreeds().then((r) => r.data),
  });

  const debounced = useDebounce({ breedId, sex }, 600);
  React.useEffect(() => {
    onInputsChange(debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced.breedId, debounced.sex]);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {dogs.length > 1 ? (
        <ToolUnitToggle<string>
          options={dogs.map((d) => ({ value: d.id, label: d.name }))}
          value={selectedDog?.id ?? ""}
          onChange={setDogId}
        />
      ) : null}

      <ToolSection label={t("tools.dogIdealWeight.sex")}>
        <ToolUnitToggle<Sex>
          options={[
            { value: "MALE", label: t("tools.dogIdealWeight.male") },
            { value: "FEMALE", label: t("tools.dogIdealWeight.female") },
            { value: "UNKNOWN", label: t("tools.dogIdealWeight.unknownSex") },
          ]}
          value={sex}
          onChange={setSex}
        />
      </ToolSection>

      <QueryBoundary query={breedsQuery}>
        {(breeds: DogBreedStandard[]) => {
          const breed = breeds.find((b) => b.breedId === breedId) ?? null;
          const range = breed ? rangeForSex(breed, sex) : null;
          const status =
            range && currentKg != null
              ? currentKg < range.min
                ? "under"
                : currentKg > range.max
                  ? "over"
                  : "ideal"
              : null;
          return (
            <>
              <BreedPicker
                breeds={breeds}
                value={breedId}
                onChange={setBreedId}
              />
              {range ? (
                <ToolResultCard
                  label={t("tools.dogIdealWeight.idealRange")}
                  value={`${range.min}–${range.max}`}
                  unit="kg"
                  caption={
                    currentKg != null
                      ? `${t("tools.dogIdealWeight.current")}: ${currentKg} kg · ${t(`tools.dogIdealWeight.status.${status}` as never)}`
                      : t("tools.dogIdealWeight.disclaimer")
                  }
                />
              ) : null}
            </>
          );
        }}
      </QueryBoundary>
    </ScrollView>
  );
};

function BreedPicker({
  breeds,
  value,
  onChange,
}: {
  breeds: DogBreedStandard[];
  value: string;
  onChange: (id: string) => void;
}): React.JSX.Element {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.breedTrack}
    >
      {breeds.map((b) => {
        const selected = b.breedId === value;
        return (
          <NorboPressable
            key={b.breedId}
            scale="text"
            haptic="light"
            onPress={() => onChange(b.breedId)}
            style={[
              styles.chip,
              selected && {
                backgroundColor: theme.colors.primarySoft,
                borderColor: theme.colors.primary,
              },
            ]}
          >
            <Text
              style={[
                styles.chipLabel,
                {
                  color: selected
                    ? theme.colors.textPrimary
                    : theme.colors.textSecondary,
                },
              ]}
            >
              {t(b.nameKey as never)}
            </Text>
          </NorboPressable>
        );
      })}
    </ScrollView>
  );
}

export default DogIdealWeightTool;

const styles = StyleSheet.create((theme) => ({
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    paddingBottom: theme.spacing["4xl"],
  },
  breedTrack: { gap: theme.spacing.sm, paddingVertical: theme.spacing.xs },
  chip: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface,
    borderWidth: theme.hairline,
    borderColor: theme.colors.border,
  },
  chipLabel: { ...theme.typography.footnote },
}));

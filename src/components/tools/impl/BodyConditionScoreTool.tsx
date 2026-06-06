import { ToolCategoryPicker } from "@/components/tools/ToolCategoryPicker";
import { ToolResultCard, ToolSection } from "@/components/tools/ui";
import { QueryBoundary } from "@/components/ui/QueryBoundary";
import { SingleSelectSheet } from "@/components/ui/SingleSelectSheet";
import { useDebounce } from "@/hooks/useDebounce";
import { careKnowledgeApi } from "@/services/care-knowledge.api";
import type { ServiceToolInput } from "@/shared/services-contract";
import type { BcsScale } from "@/types/care-knowledge.types";
import { PetCategory } from "@/types/pet.types";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, Text } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { ToolComponent } from "../tool-component";

type Inputs = ServiceToolInput<"body-condition-score">;

function interpret(scale: BcsScale, score: number): string | null {
  return scale.bands.find((b) => score <= b.maxScore)?.interpretationKey ?? null;
}

const BodyConditionScoreTool: ToolComponent<"body-condition-score"> = ({
  pet,
  initialInputs,
  onInputsChange,
}) => {
  const { t } = useTranslation();
  const [category, setCategory] = React.useState<PetCategory>(
    initialInputs?.category ?? pet?.category ?? PetCategory.MAMMAL_DOG,
  );
  const [answers, setAnswers] = React.useState<(number | undefined)[]>(
    initialInputs?.answers ?? [],
  );

  const scaleQuery = useQuery({
    queryKey: ["care-knowledge", "bcs", category],
    queryFn: () => careKnowledgeApi.bcs(category).then((r) => r.data),
  });

  const onCategoryChange = (c: PetCategory): void => {
    setCategory(c);
    setAnswers([]);
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <ToolCategoryPicker value={category} onChange={onCategoryChange} />

      <QueryBoundary query={scaleQuery} isEmpty={(s) => s === null}>
        {(scale) =>
          scale ? (
            <Questionnaire
              scale={scale}
              category={category}
              answers={answers}
              setAnswers={setAnswers}
              onInputsChange={onInputsChange}
            />
          ) : (
            <Text style={styles.hint}>{t("tools.bodyConditionScore.unsupported")}</Text>
          )
        }
      </QueryBoundary>
    </ScrollView>
  );
};

function Questionnaire({
  scale,
  category,
  answers,
  setAnswers,
  onInputsChange,
}: {
  scale: BcsScale;
  category: PetCategory;
  answers: (number | undefined)[];
  setAnswers: React.Dispatch<React.SetStateAction<(number | undefined)[]>>;
  onInputsChange: (inputs: Inputs) => void;
}): React.JSX.Element {
  const { t } = useTranslation();

  const setAnswer = (qIdx: number, optIdx: number): void =>
    setAnswers((prev) => {
      const next = [...prev];
      next[qIdx] = optIdx;
      return next;
    });

  const allAnswered =
    answers.length === scale.questions.length &&
    answers.every((a) => a !== undefined);

  const complete: Inputs | null = allAnswered
    ? { category, answers: answers as number[] }
    : null;
  const debounced = useDebounce(complete, 500);
  React.useEffect(() => {
    if (debounced) onInputsChange(debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(debounced)]);

  const score = allAnswered
    ? Math.round(
        scale.questions.reduce(
          (sum, q, i) => sum + q.options[answers[i] as number].score,
          0,
        ) / scale.questions.length,
      )
    : null;
  const bandKey = score != null ? interpret(scale, score) : null;

  return (
    <>
      {scale.questions.map((q, qIdx) => (
        <ToolSection key={q.promptKey} label={t(q.promptKey as never)}>
          <SingleSelectSheet<string>
            title={t(q.promptKey as never)}
            placeholder={t("common.select")}
            options={q.options.map((o, i) => ({
              value: String(i),
              label: t(o.labelKey as never),
            }))}
            value={answers[qIdx] !== undefined ? String(answers[qIdx]) : ""}
            onChange={(v) => setAnswer(qIdx, Number(v))}
          />
        </ToolSection>
      ))}

      {score != null ? (
        <ToolResultCard
          label={t(scale.scaleNameKey as never)}
          value={`${score} / 9`}
          caption={
            (bandKey ? `${t(bandKey as never)} · ` : "") +
            t("tools.bodyConditionScore.disclaimer")
          }
        />
      ) : null}
    </>
  );
}

export default BodyConditionScoreTool;

const styles = StyleSheet.create((theme) => ({
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    paddingBottom: theme.spacing["4xl"],
  },
  hint: {
    ...theme.typography.footnote,
    color: theme.colors.textTertiary,
    paddingTop: theme.spacing.lg,
  },
}));

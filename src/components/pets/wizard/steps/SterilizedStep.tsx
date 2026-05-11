import React from "react";
import { useTranslation } from "react-i18next";
import type { PetCategory } from "@/types/pet.types";
import { PetStepHeading } from "../PetStepHeading";
import { PetWizardButton } from "../PetWizardButton";
import { PetWizardChoiceRow } from "../PetWizardChoiceRow";
import { PetWizardHero } from "../PetWizardHero";
import { PetWizardLayout } from "../PetWizardLayout";
import { TOTAL_FORM_STEPS } from "../wizard.types";

type SterilizedChoice = "yes" | "no" | "unknown";

interface SterilizedStepProps {
  category: PetCategory;
  value: boolean | null | undefined;
  onChange: (value: boolean | null) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  saving?: boolean;
}

/**
 * SterilizedStep — yes / no / unknown selector. Final form step: the
 * primary CTA performs the API submission, hence the optional saving
 * prop.
 */
export function SterilizedStep({
  category,
  value,
  onChange,
  onNext,
  onBack,
  onSkip,
  saving,
}: SterilizedStepProps) {
  const { t } = useTranslation();

  const current: SterilizedChoice =
    value === true ? "yes" : value === false ? "no" : "unknown";

  function handleChange(next: SterilizedChoice) {
    onChange(next === "yes" ? true : next === "no" ? false : null);
  }

  const options = [
    { value: "yes" as const, label: t("petWizard.sterilizedYes") },
    { value: "no" as const, label: t("petWizard.sterilizedNo") },
    { value: "unknown" as const, label: t("petWizard.sterilizedUnknown") },
  ];

  return (
    <PetWizardLayout
      step={5}
      leading="back"
      onLeadingPress={onBack}
      canSkip
      onSkip={onSkip}
      skipLabel={t("petWizard.skip")}
      footer={
        <PetWizardButton
          label={t("petWizard.continue")}
          onPress={onNext}
          loading={saving}
          trailingChevron
        />
      }
    >
      <PetWizardHero
        category={category}
        badge={t("petWizard.stepCounter", {
          current: "5",
          total: String(TOTAL_FORM_STEPS),
          category: t(`petForm.categories.${category}`),
        })}
      />

      <PetStepHeading
        title={t("petWizard.sterilizedTitle")}
        subtitle={t("petWizard.sterilizedSubtitle")}
      />

      <PetWizardChoiceRow<SterilizedChoice>
        options={options}
        value={current}
        onChange={handleChange}
      />
    </PetWizardLayout>
  );
}

import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { type PetCategory, Sex } from "@/types/pet.types";
import { ChipSelector, type ChipOption } from "@/components/ui/ChipSelector";
import { PetStepHeading } from "../PetStepHeading";
import { PetWizardButton } from "../PetWizardButton";
import { PetWizardHero } from "../PetWizardHero";
import { PetWizardLayout } from "../PetWizardLayout";
import { TOTAL_FORM_STEPS } from "../wizard.types";

interface SexStepProps {
  category: PetCategory;
  value: Sex | undefined;
  onChange: (value: Sex) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

/**
 * SexStep — three-way segmented selector (male / female / unknown).
 * Skippable; the absence of a value is treated as `Sex.UNKNOWN` at
 * submission time.
 */
export function SexStep({
  category,
  value,
  onChange,
  onNext,
  onBack,
  onSkip,
}: SexStepProps) {
  const { t } = useTranslation();

  const options = useMemo<ChipOption<Sex>[]>(
    () => [
      { value: Sex.FEMALE, label: t("petForm.sexFemale") },
      { value: Sex.MALE, label: t("petForm.sexMale") },
      { value: Sex.UNKNOWN, label: t("petForm.sexUnknown") },
    ],
    [t],
  );

  return (
    <PetWizardLayout
      step={3}
      leading="back"
      onLeadingPress={onBack}
      canSkip
      onSkip={onSkip}
      skipLabel={t("petWizard.skip")}
      footer={
        <PetWizardButton
          label={t("petWizard.continue")}
          onPress={onNext}
          trailingChevron
        />
      }
    >
      <PetWizardHero
        category={category}
        badge={t("petWizard.stepCounter", {
          current: "3",
          total: String(TOTAL_FORM_STEPS),
          category: t(`petForm.categories.${category}`),
        })}
      />

      <PetStepHeading
        title={t("petWizard.sexTitle")}
        subtitle={t("petWizard.sexSubtitle")}
      />

      <ChipSelector
        options={options}
        value={value ?? Sex.UNKNOWN}
        onChange={onChange}
      />
    </PetWizardLayout>
  );
}

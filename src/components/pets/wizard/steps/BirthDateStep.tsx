import React, { useMemo } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { useTranslation } from "react-i18next";
import { format, parseISO } from "date-fns";
import { DateField } from "@/components/ui/DateField";
import type { PetCategory } from "@/types/pet.types";
import { PetStepHeading } from "../PetStepHeading";
import { PetWizardButton } from "../PetWizardButton";
import { PetWizardHero } from "../PetWizardHero";
import { PetWizardLayout } from "../PetWizardLayout";
import { TOTAL_FORM_STEPS } from "../wizard.types";

interface BirthDateStepProps {
  category: PetCategory;
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

const ISO_FMT = "yyyy-MM-dd";

/**
 * BirthDateStep — wraps the shared `DateField` primitive in the
 * wizard chrome. The wizard stores the value as a `YYYY-MM-DD` ISO
 * string (schema + API contract); the conversion to/from `Date`
 * lives here.
 */
export function BirthDateStep({
  category,
  value,
  onChange,
  onNext,
  onBack,
  onSkip,
}: BirthDateStepProps) {
  const { t } = useTranslation();

  const today = useMemo(() => new Date(), []);

  const selected: Date | null = useMemo(() => {
    if (!value) return null;
    const parsed = parseISO(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }, [value]);

  function handleChange(date: Date) {
    onChange(format(date, ISO_FMT));
  }

  return (
    <PetWizardLayout
      step={4}
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
          current: "4",
          total: String(TOTAL_FORM_STEPS),
          category: t(`petForm.categories.${category}`),
        })}
      />

      <PetStepHeading
        title={t("petWizard.birthDateTitle")}
        subtitle={t("petWizard.birthDateSubtitle")}
      />

      <View style={styles.pickerWrap}>
        <DateField
          value={selected}
          onChange={handleChange}
          maximumDate={today}
          placeholder={t("petWizard.birthDatePick")}
        />
      </View>
    </PetWizardLayout>
  );
}

const styles = StyleSheet.create((theme) => ({
  pickerWrap: {
    paddingHorizontal: theme.spacing.md,
    alignItems: "center",
  },
}));

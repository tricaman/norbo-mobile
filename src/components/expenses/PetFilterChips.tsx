import { Avatar } from "@/components/ui/Avatar";
import {
  MultiSelectSheet,
  type MultiSelectOption,
} from "@/components/ui/MultiSelectSheet";
import type { Pet } from "@/types/pet.types";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";

interface PetFilterChipsProps {
  pets: Pet[];
  /** Selected pet ids. Empty array = "all pets". */
  selected: string[];
  onChange: (selected: string[]) => void;
}

/**
 * PetFilterChips — multi-select pet filter backed by a bottom sheet.
 *
 * Renders a single trigger chip that summarises the current selection.
 * Tapping it opens a sheet where the user can toggle individual pets.
 * An empty `selected` array means "all pets".
 */
export function PetFilterChips({
  pets,
  selected,
  onChange,
}: PetFilterChipsProps): React.ReactElement {
  const { t } = useTranslation();

  const options: MultiSelectOption<string>[] = useMemo(
    () =>
      pets.map((pet) => ({
        value: pet.id,
        label: pet.name,
        leading: () => (
          <Avatar name={pet.name} source={pet.photoUrl} size="sm" />
        ),
      })),
    [pets],
  );

  return (
    <MultiSelectSheet
      options={options}
      selected={selected}
      onChange={onChange}
      title={t("expenses.petFilterTitle")}
      allLabel={t("expenses.petAll")}
      emptyMeansAll
    />
  );
}

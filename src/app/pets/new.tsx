import { queryClient } from "@/app/_layout";
import { CategoryStep } from "@/components/pets/wizard/steps/CategoryStep";
import { ConfirmStep } from "@/components/pets/wizard/steps/ConfirmStep";
import { NameStep } from "@/components/pets/wizard/steps/NameStep";
import { SexStep } from "@/components/pets/wizard/steps/SexStep";
import { SpeciesStep } from "@/components/pets/wizard/steps/SpeciesStep";
import { SubcategoryStep } from "@/components/pets/wizard/steps/SubcategoryStep";
import { SterilizedStep } from "@/components/pets/wizard/steps/SterilizedStep";
import { BirthDateStep } from "@/components/pets/wizard/steps/BirthDateStep";
import {
  type PetWizardStep,
  type PetWizardValues,
} from "@/components/pets/wizard/wizard.types";
import { useMutation } from "@/hooks/useMutation";
import { petsApi } from "@/services/pets.api";
import {
  type Pet,
  PetCategory,
  Sex,
  type SubcategoryResult,
} from "@/types/pet.types";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";

type WizardData = Partial<PetWizardValues>;

interface WizardState {
  step: PetWizardStep;
  data: WizardData;
  createdPet: Pet | null;
  /** True when the subcategory step auto-applied a lone kind (dog/cat),
   *  so navigating back from species bypasses it. */
  subcategoryAutoSkipped: boolean;
}

const INITIAL_STATE: WizardState = {
  step: "category",
  data: {},
  createdPet: null,
  subcategoryAutoSkipped: false,
};

/**
 * NewPetScreen — orchestrates the multi-step pet creation wizard.
 *
 * State shape mirrors `PetWizardValues` (partial during the flow) plus
 * the current `step` and the eventually-created pet. Each step renders
 * its own `PetWizardLayout` chrome and only owns its slice of the data;
 * navigation callbacks (`onNext`, `onBack`, `onSkip`) flow through this
 * component so step components stay pure.
 *
 * The submission happens at the end of the last form step (sterilized).
 * Once the API returns, we transition to the celebratory `confirm` step
 * — backing out of `confirm` is intentionally disabled, and the route
 * is replaced (not pushed) when navigating to the pet profile so the
 * wizard is no longer in history.
 */
export default function NewPetScreen() {
  const router = useRouter();

  const [state, setState] = useState<WizardState>(INITIAL_STATE);
  const { step, data, createdPet, subcategoryAutoSkipped } = state;

  const update = useCallback((patch: Partial<WizardData>) => {
    setState((prev) => ({ ...prev, data: { ...prev.data, ...patch } }));
  }, []);

  const goTo = useCallback((next: PetWizardStep) => {
    setState((prev) => ({ ...prev, step: next }));
  }, []);

  // Picking a (different) category invalidates the downstream kind/species.
  const selectCategory = useCallback((category: PetCategory) => {
    setState((prev) =>
      prev.data.category === category
        ? { ...prev, data: { ...prev.data, category } }
        : {
            ...prev,
            subcategoryAutoSkipped: false,
            data: {
              ...prev.data,
              category,
              subcategoryId: null,
              subcategoryLabel: null,
              speciesId: null,
              speciesLabelFreetext: null,
            },
          },
    );
  }, []);

  // Choosing the kind invalidates any species picked under another kind.
  const selectSubcategory = useCallback(
    (sub: { id: string; label: string }) => {
      setState((prev) => ({
        ...prev,
        step: "species",
        subcategoryAutoSkipped: false,
        data: {
          ...prev.data,
          subcategoryId: sub.id,
          subcategoryLabel: sub.label,
          speciesId: null,
          speciesLabelFreetext: null,
        },
      }));
    },
    [],
  );

  // Single-kind category (dog, cat): apply the lone kind and skip the step.
  const autoSkipSubcategory = useCallback((single: SubcategoryResult | null) => {
    setState((prev) => ({
      ...prev,
      step: prev.step === "subcategory" ? "species" : prev.step,
      subcategoryAutoSkipped: true,
      data: {
        ...prev.data,
        subcategoryId: single?.id ?? null,
        subcategoryLabel: single?.commonName ?? null,
      },
    }));
  }, []);

  const close = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)");
  }, [router]);

  const { mutate: createPet, isPending } = useMutation({
    mutationFn: (input: PetWizardValues) =>
      petsApi.create({
        category: input.category,
        name: input.name.trim(),
        subcategoryId: input.subcategoryId ?? null,
        speciesId: input.speciesId ?? null,
        speciesLabelFreetext: input.speciesLabelFreetext ?? null,
        sex: input.sex ?? Sex.UNKNOWN,
        birthDate: input.birthDate ?? null,
        sterilized: input.sterilized ?? null,
      }),
    showSuccessToast: false,
    onSuccess: (response) => {
      void queryClient.invalidateQueries({ queryKey: ["pets"] });
      setState((prev) => ({
        ...prev,
        step: "confirm",
        createdPet: response.data,
      }));
    },
  });

  const submit = useCallback(() => {
    if (!data.category || !data.name?.trim()) return;
    createPet({
      category: data.category,
      name: data.name,
      subcategoryId: data.subcategoryId ?? null,
      speciesId: data.speciesId ?? null,
      speciesLabelFreetext: data.speciesLabelFreetext ?? null,
      sex: data.sex,
      birthDate: data.birthDate ?? null,
      sterilized: data.sterilized ?? null,
    });
  }, [createPet, data]);

  const reset = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  // ── Step routing ──────────────────────────────────────────────────
  if (step === "category") {
    return (
      <CategoryStep
        value={data.category}
        onChange={selectCategory}
        onNext={() => goTo("name")}
        onClose={close}
      />
    );
  }

  if (!data.category) {
    // Defensive: any post-category step requires a category. If the
    // user landed here without one (e.g. via deep link), reset.
    return (
      <CategoryStep
        value={undefined}
        onChange={selectCategory}
        onNext={() => goTo("name")}
        onClose={close}
      />
    );
  }

  if (step === "name") {
    return (
      <NameStep
        category={data.category}
        value={data.name ?? ""}
        onChange={(name) => update({ name })}
        onNext={() => goTo("subcategory")}
        onBack={() => goTo("category")}
      />
    );
  }

  if (step === "subcategory") {
    return (
      <SubcategoryStep
        category={data.category}
        onSelect={selectSubcategory}
        onAutoSkip={autoSkipSubcategory}
        onBack={() => goTo("name")}
      />
    );
  }

  if (step === "species") {
    return (
      <SpeciesStep
        category={data.category}
        subcategoryId={data.subcategoryId ?? undefined}
        speciesId={data.speciesId}
        speciesLabel={data.speciesLabelFreetext ?? undefined}
        onChange={({ id, label }) =>
          update({
            speciesId: id,
            speciesLabelFreetext: label,
          })
        }
        onNext={() => goTo("sex")}
        onBack={() =>
          goTo(subcategoryAutoSkipped ? "name" : "subcategory")
        }
        onSkip={() => {
          update({ speciesId: null, speciesLabelFreetext: null });
          goTo("sex");
        }}
      />
    );
  }

  if (step === "sex") {
    return (
      <SexStep
        category={data.category}
        value={data.sex}
        onChange={(sex) => update({ sex })}
        onNext={() => goTo("birthDate")}
        onBack={() => goTo("species")}
        onSkip={() => goTo("birthDate")}
      />
    );
  }

  if (step === "birthDate") {
    return (
      <BirthDateStep
        category={data.category}
        value={data.birthDate}
        onChange={(birthDate) => update({ birthDate })}
        onNext={() => goTo("sterilized")}
        onBack={() => goTo("sex")}
        onSkip={() => {
          update({ birthDate: null });
          goTo("sterilized");
        }}
      />
    );
  }

  if (step === "sterilized") {
    return (
      <SterilizedStep
        category={data.category}
        value={data.sterilized}
        onChange={(sterilized) => update({ sterilized })}
        onNext={submit}
        onBack={() => goTo("birthDate")}
        onSkip={() => {
          update({ sterilized: null });
          submit();
        }}
        saving={isPending}
      />
    );
  }

  // ── Confirm ───────────────────────────────────────────────────────
  if (step === "confirm" && createdPet) {
    return (
      <ConfirmStep
        category={createdPet.category}
        petName={createdPet.name}
        onGoToProfile={() => router.replace(`/pets/${createdPet.id}`)}
        onAddAnother={reset}
      />
    );
  }

  // Fallback to category step. Should not happen but keeps the screen
  // recoverable rather than rendering nothing.
  return (
    <CategoryStep
      value={data.category}
      onChange={selectCategory}
      onNext={() => goTo("name")}
      onClose={close}
    />
  );
}

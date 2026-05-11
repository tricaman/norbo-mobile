import { queryClient } from "@/app/_layout";
import { CategoryStep } from "@/components/pets/wizard/steps/CategoryStep";
import { ConfirmStep } from "@/components/pets/wizard/steps/ConfirmStep";
import { NameStep } from "@/components/pets/wizard/steps/NameStep";
import { SexStep } from "@/components/pets/wizard/steps/SexStep";
import { SpeciesStep } from "@/components/pets/wizard/steps/SpeciesStep";
import { SterilizedStep } from "@/components/pets/wizard/steps/SterilizedStep";
import { BirthDateStep } from "@/components/pets/wizard/steps/BirthDateStep";
import {
  type PetWizardStep,
  type PetWizardValues,
} from "@/components/pets/wizard/wizard.types";
import { useMutation } from "@/hooks/useMutation";
import { petsApi } from "@/services/pets.api";
import { type Pet, PetCategory, Sex } from "@/types/pet.types";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";

type WizardData = Partial<PetWizardValues>;

interface WizardState {
  step: PetWizardStep;
  data: WizardData;
  createdPet: Pet | null;
}

const INITIAL_STATE: WizardState = {
  step: "category",
  data: {},
  createdPet: null,
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
  const { step, data, createdPet } = state;

  const update = useCallback((patch: Partial<WizardData>) => {
    setState((prev) => ({ ...prev, data: { ...prev.data, ...patch } }));
  }, []);

  const goTo = useCallback((next: PetWizardStep) => {
    setState((prev) => ({ ...prev, step: next }));
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
        onChange={(category: PetCategory) => update({ category })}
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
        onChange={(category: PetCategory) => update({ category })}
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
        onNext={() => goTo("species")}
        onBack={() => goTo("category")}
      />
    );
  }

  if (step === "species") {
    return (
      <SpeciesStep
        category={data.category}
        speciesId={data.speciesId}
        speciesLabel={data.speciesLabelFreetext ?? undefined}
        onChange={({ id, label }) =>
          update({
            speciesId: id,
            speciesLabelFreetext: label,
          })
        }
        onNext={() => goTo("sex")}
        onBack={() => goTo("name")}
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
      onChange={(category: PetCategory) => update({ category })}
      onNext={() => goTo("name")}
      onClose={close}
    />
  );
}

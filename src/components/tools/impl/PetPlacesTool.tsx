import { ToolLoading } from "@/components/tools/ToolLoading";
import {
  ALL_PLACE_KINDS,
  PET_SERVICE_KINDS,
} from "@/components/tools/places/kind-meta";
import { PlacesMapView } from "@/components/tools/places/PlacesMapView";
import { useDogs } from "@/hooks/useDogs";
import type { ServiceToolInput } from "@/shared/services-contract";
import React from "react";
import type { ToolComponent } from "../tool-component";

type Inputs = ServiceToolInput<"pet-places">;

/**
 * PetPlacesTool — THE places map: every layer an owner might want, from the
 * species-neutral services (vets, shops, grooming, shelters, boarding) to the
 * dog-only ones (parks, beaches, trails, dog-friendly venues), sorted out by
 * the filter drawer. Cross-species and free, so it shows for every user, even
 * one with no pet registered.
 *
 * Which layers START on is personalized: services for everyone, dog layers
 * only for dog owners — nobody has to switch off five layers they can't use,
 * and no dog owner loses the map that used to be a separate tool
 * (`dog-friendly-places`, merged in on 2026-08-22).
 *
 * The cast on `kinds` is safe: PlacesMapView only ever toggles within
 * `allowedKinds`, which here is exactly the contract's enum.
 */
const sameLayers = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && new Set(a).size === new Set([...a, ...b]).size;

const PetPlacesTool: ToolComponent<"pet-places"> = ({
  initialInputs,
  onInputsChange,
}) => {
  const { dogs, isPending } = useDogs();
  const saved = initialInputs?.kinds ?? null;

  /**
   * Until 2026-08-22 the map persisted its own defaults on every open without
   * the user touching anything (a mount-time write, since fixed), so a saved
   * selection equal to exactly the five service layers is indistinguishable
   * from "never chose" — and honouring it would hand a dog owner the merged
   * map with every dog layer off. Treat it as absent for one release, then
   * drop this: by then a services-only selection means the user picked it.
   */
  const persisted = saved && sameLayers(saved, PET_SERVICE_KINDS) ? null : saved;

  // The map seeds its selection once, so mounting before pets load would
  // freeze the wrong defaults in. Only wait when defaults actually matter —
  // a persisted selection wins regardless, and `["pets"]` is usually warm.
  // The latch makes the wait one-way: once the map is up it must never be
  // torn down (that would drop the session's selection) just because the
  // restored inputs later resolve to null.
  const mounted = React.useRef(false);
  if (!mounted.current && persisted == null && isPending) {
    return <ToolLoading />;
  }
  mounted.current = true;

  return (
    <PlacesMapView
      allowedKinds={ALL_PLACE_KINDS}
      defaultKinds={dogs.length > 0 ? ALL_PLACE_KINDS : PET_SERVICE_KINDS}
      initialKinds={persisted}
      onKindsChange={(kinds) =>
        onInputsChange({ kinds: kinds as Inputs["kinds"] })
      }
    />
  );
};

export default PetPlacesTool;

import { PET_SERVICE_KINDS } from "@/components/tools/places/kind-meta";
import { PlacesMapView } from "@/components/tools/places/PlacesMapView";
import type { ServiceToolInput } from "@/shared/services-contract";
import React from "react";
import type { ToolComponent } from "../tool-component";

type Inputs = ServiceToolInput<"pet-places">;

/**
 * PetPlacesTool — the species-neutral places map: the pet SERVICES every owner
 * needs (vets, shops, grooming, shelters, boarding). Cross-species and free,
 * so it shows for every user — even one with no pet registered.
 * `DogFriendlyPlacesTool` is the dog superset (same engine, extra layers).
 *
 * The cast on `kinds` is safe: PlacesMapView only ever toggles within
 * `allowedKinds`, which here is exactly the contract's enum subset.
 */
const PetPlacesTool: ToolComponent<"pet-places"> = ({
  initialInputs,
  onInputsChange,
}) => (
  <PlacesMapView
    allowedKinds={PET_SERVICE_KINDS}
    initialKinds={initialInputs?.kinds ?? null}
    onKindsChange={(kinds) =>
      onInputsChange({ kinds: kinds as Inputs["kinds"] })
    }
  />
);

export default PetPlacesTool;

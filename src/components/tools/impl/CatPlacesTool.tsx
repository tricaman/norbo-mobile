import { CAT_KINDS } from "@/components/tools/places/kind-meta";
import { PlacesMapView } from "@/components/tools/places/PlacesMapView";
import type { ServiceToolInput } from "@/shared/services-contract";
import React from "react";
import type { ToolComponent } from "../tool-component";

type Inputs = ServiceToolInput<"cat-places">;

/**
 * CatPlacesTool — the cat-owner variant of the places map: vets, pet shops,
 * grooming, shelters (adozioni) and boarding (pensioni) — what OSM data
 * actually supports for cats. Thin wrapper over the shared PlacesMapView.
 *
 * The cast on `kinds` is safe: PlacesMapView only ever toggles within
 * `allowedKinds`, which here is exactly the contract's enum subset.
 */
const CatPlacesTool: ToolComponent<"cat-places"> = ({
  initialInputs,
  onInputsChange,
}) => (
  <PlacesMapView
    allowedKinds={CAT_KINDS}
    initialKinds={initialInputs?.kinds ?? null}
    onKindsChange={(kinds) =>
      onInputsChange({ kinds: kinds as Inputs["kinds"] })
    }
  />
);

export default CatPlacesTool;

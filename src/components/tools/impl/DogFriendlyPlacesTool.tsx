import { DOG_KINDS } from "@/components/tools/places/kind-meta";
import { PlacesMapView } from "@/components/tools/places/PlacesMapView";
import type { ServiceToolInput } from "@/shared/services-contract";
import React from "react";
import type { ToolComponent } from "../tool-component";

type Inputs = ServiceToolInput<"dog-friendly-places">;

/**
 * DogFriendlyPlacesTool — thin wrapper over the shared PlacesMapView
 * (the CatPlantToxicityTool precedent: same view, different tool id + kind
 * set). The dog SUPERSET: the dog-only layers (parks, beaches, trails,
 * dog-friendly venues) plus the shared service layers of `pet-places`, so a
 * dog owner needs one map only. The persisted input is the LAYER SELECTION
 * ONLY — never coordinates.
 */
const DogFriendlyPlacesTool: ToolComponent<"dog-friendly-places"> = ({
  initialInputs,
  onInputsChange,
}) => (
  <PlacesMapView
    allowedKinds={DOG_KINDS}
    initialKinds={initialInputs?.kinds ?? null}
    onKindsChange={(kinds) => onInputsChange({ kinds } as Inputs)}
  />
);

export default DogFriendlyPlacesTool;

import type { ServiceToolId } from "@/shared/services-contract";
import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import type { ToolComponent, ToolComponentProps } from "./tool-component";

export interface ToolRegistryEntry {
  /**
   * The tool's screen body, lazily loaded so its module is only evaluated
   * when the tool is opened (snappier tab). Stored with the ERASED props
   * shape — the generic loader feeds it this id's runtime inputs; per-tool
   * typing lives in the tool file via `ToolComponent<Id>`.
   */
  component: LazyExoticComponent<ComponentType<ToolComponentProps>>;
  /**
   * Whether the tool's INPUTS should be persisted (results are always
   * recomputed, never stored — see the shared contract).
   */
  persistsResult: boolean;
}

/**
 * defineLazyTool — register a real tool. Ties the lazily-imported module to
 * its id at COMPILE TIME (the default export must be `ToolComponent<Id>`),
 * then erases to the storable entry. The single cast is safe: the loader
 * always feeds this id's runtime-validated inputs. (`ToolComponentProps` is
 * invariant in its input type, so the erasure cannot be expressed without it.)
 */
export function defineLazyTool<Id extends ServiceToolId>(
  loader: () => Promise<{ default: ToolComponent<Id> }>,
  persistsResult: boolean,
): ToolRegistryEntry {
  return {
    component: lazy(loader) as unknown as ToolRegistryEntry["component"],
    persistsResult,
  };
}

/**
 * TOOL_REGISTRY — the frontend source of truth: maps a tool `id` to its
 * (lazy) component and `persistsResult` flag. This is the "client" half of
 * the client∩server intersection; the app only renders tools present here.
 *
 * `Partial` is deliberate: an app build may not ship a component for every
 * contract id (forward/backward version skew is expected and safe).
 *
 * Adding a tool touches only the three sources of truth — this registry, the
 * shared `services-contract`, and the backend tool catalog — never the
 * intersection/filter logic or the loader.
 */
export const TOOL_REGISTRY: Partial<Record<ServiceToolId, ToolRegistryEntry>> =
  {
    "dog-calorie-needs": defineLazyTool<"dog-calorie-needs">(
      () => import("./impl/DogCalorieTool"),
      true,
    ),
    "aquarium-volume": defineLazyTool<"aquarium-volume">(
      () => import("./impl/AquariumVolumeTool"),
      true,
    ),
    "reptile-environment-guide": defineLazyTool<"reptile-environment-guide">(
      () => import("./impl/ReptileGuideTool"),
      false,
    ),
    "pet-age-human-years": defineLazyTool<"pet-age-human-years">(
      () => import("./impl/PetAgeTool"),
      true,
    ),
    "pet-unit-converter": defineLazyTool<"pet-unit-converter">(
      () => import("./impl/PetUnitConverterTool"),
      false,
    ),
    "maintenance-cost": defineLazyTool<"maintenance-cost">(
      () => import("./impl/MaintenanceCostTool"),
      true,
    ),
    "food-consumption": defineLazyTool<"food-consumption">(
      () => import("./impl/FoodConsumptionTool"),
      true,
    ),
    "food-plant-toxicity": defineLazyTool<"food-plant-toxicity">(
      () => import("./impl/FoodPlantToxicityTool"),
      false,
    ),
    "body-condition-score": defineLazyTool<"body-condition-score">(
      () => import("./impl/BodyConditionScoreTool"),
      true,
    ),
  };

/** The tool ids this app build can render — the local side of the intersection. */
export const LOCAL_TOOL_IDS = Object.keys(TOOL_REGISTRY) as ServiceToolId[];

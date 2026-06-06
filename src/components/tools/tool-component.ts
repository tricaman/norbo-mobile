import type {
  ServiceToolId,
  ServiceToolInput,
} from "@/shared/services-contract";
import type { Pet } from "@/types/pet.types";
import type { ComponentType } from "react";

/**
 * ToolComponentProps — the contract every tool component implements.
 *
 * Tools are PURE and context-unaware: they know nothing about persistence,
 * premium, navigation or telemetry (the ToolScreen loader owns all of that).
 * They receive the current pet and strongly-typed initial inputs, and notify
 * NEW inputs through `onInputsChange`. The callback communicates ONLY the
 * inputs — never a computed result (results are recomputed from inputs).
 *
 * `TInputs` defaults to `Record<string, unknown>` (the erased shape the
 * generic loader passes); a real tool parametrizes it with its own input type
 * via `ToolComponent<Id>`, eliminating untyped Json and surfacing mismatches
 * at compile time.
 */
export interface ToolComponentProps<TInputs = Record<string, unknown>> {
  /** The pet the tool is scoped to, or null for a user-level invocation. */
  pet: Pet | null;
  /** Previously-saved, schema-compatible inputs to seed the tool, or null. */
  initialInputs: TInputs | null;
  /** Notify the loader of new inputs to persist. Inputs only — no results. */
  onInputsChange: (inputs: TInputs) => void;
}

/**
 * ToolComponent — a component for tool `Id`, with its input type derived from
 * the shared Zod contract (`ServiceToolInput<Id>`). Annotate a tool's default
 * export with this to get fully-typed `initialInputs` / `onInputsChange`:
 *
 * ```ts
 * const PetAgeTool: ToolComponent<"pet-age-human-years"> = ({ initialInputs, onInputsChange }) => { ... };
 * export default PetAgeTool;
 * ```
 */
export type ToolComponent<Id extends ServiceToolId> = ComponentType<
  ToolComponentProps<ServiceToolInput<Id>>
>;

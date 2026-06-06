// ⚠️  AUTO-GENERATED — DO NOT EDIT.
// Source of truth: norbo-api/src/shared/services-contract/index.ts
// Regenerate with `pnpm sync:contracts` in norbo-api.

/**
 * services-contract — the shared contract for the Services Tool System.
 *
 * Single source of truth, defined once and consumed by BOTH norbo-api
 * and norbo-mobile. Framework-free on purpose: NO Nest, NO React, only
 * `zod`. The mobile copy under `norbo-mobile/src/shared/services-contract`
 * is generated from this file by `scripts/sync-shared-contracts.mjs`
 * (run `pnpm sync:contracts` in norbo-api) — never edit it by hand.
 *
 * Separation of concerns — this file owns ONLY the three things every tool
 * shares across the wire:
 *   - `id`            the one and only key for a tool (a string).
 *   - `inputSchema`   the Zod schema validating the tool's user input.
 *   - `schemaVersion` the input shape version, bumped when the input shape
 *                     changes in a non-backward-compatible way.
 *
 * What does NOT belong here:
 *   - the React component and `persistsResult` flag → frontend registry.
 *   - categories, `isPremium`, availability, i18n keys, icon → backend
 *     metadata, served via the API.
 *   - the calculation/formula → it lives in the frontend component. Inputs
 *     are the source of truth; results are recomputed, never persisted.
 *     `schemaVersion` exists solely to discard saved inputs whose shape is
 *     no longer compatible — it does NOT version the formulas.
 *
 * Adding a new tool is intentionally cheap and additive (Open/Closed):
 *   1. declare its input schema (`z.object({ ... })`);
 *   2. add one entry to `SERVICE_TOOL_CONTRACTS` keyed by its `id`.
 * Nothing else in this file changes.
 */
import { z } from 'zod';
import { ExpenseCategory, PetCategory } from '../pet-event-schemas';

const petCategoryEnum = z.enum(
  Object.values(PetCategory) as [PetCategory, ...PetCategory[]],
);
const expenseCategoryEnum = z.enum(
  Object.values(ExpenseCategory) as [ExpenseCategory, ...ExpenseCategory[]],
);
const frequencyEnum = z.enum(['WEEK', 'MONTH', 'YEAR']);

/**
 * Shape every contract entry satisfies. Kept as a structural constraint
 * (not the storage type) so `SERVICE_TOOL_CONTRACTS` can stay a literal
 * object and preserve per-tool input inference via `ServiceToolInput`.
 */
interface ServiceToolContract {
  /** Must equal the registry key — the single key for the tool. */
  readonly id: string;
  /** Bumped only on incompatible input-shape changes. Positive integer. */
  readonly schemaVersion: number;
  /** Validates the tool's user input. */
  readonly inputSchema: z.ZodType;
}

// ── Tool input schemas ────────────────────────────────────────────────────────
// One `export const <toolName>Input = z.object({ ... })` per tool.

/**
 * `dog-calorie-needs` — indicative daily energy requirement for a dog, from
 * the published RER/MER husbandry formula (RER = 70 × kg^0.75, MER = RER ×
 * lifestage/activity factor). NOT clinical and NOT a drug dose; the frontend
 * computes the figure and shows a "not a substitute for your vet" disclaimer.
 */
export const dogCalorieNeedsInput = z.object({
  weightKg: z.number().positive().max(120),
  ageMonths: z.number().int().min(0).max(360),
  activity: z.enum(['LOW', 'NORMAL', 'HIGH']),
  neutered: z.boolean(),
});

/**
 * `aquarium-volume` — tank dimensions (cm) → water volume, with a percentage
 * correction for the displacement of decorations/substrate. The formula and
 * the litre/gallon + stocking presentation live in the frontend component.
 */
export const aquariumVolumeInput = z.object({
  lengthCm: z.number().positive().max(1000),
  widthCm: z.number().positive().max(1000),
  heightCm: z.number().positive().max(1000),
  decorPercent: z.number().min(0).max(50),
});

/**
 * `pet-age-human-years` — indicative pet-age → human-equivalent-years
 * converter for dogs and cats; the mapping depends on body-size class. The
 * conversion curve lives in the frontend component, not here. Non-clinical.
 */
export const petAgeHumanYearsInput = z.object({
  ageMonths: z.number().int().min(0).max(360),
  sizeClass: z.enum(['SMALL', 'MEDIUM', 'LARGE']),
});

// ── Cross-species tools ───────────────────────────────────────────────────────

/**
 * `pet-unit-converter` — offline unit conversion within a group (weight,
 * length, temperature, volume). No pet, no persistence. The conversion table
 * lives in the frontend component; units are free strings validated there.
 */
export const petUnitConverterInput = z.object({
  group: z.enum(['WEIGHT', 'LENGTH', 'TEMPERATURE', 'VOLUME']),
  value: z.number(),
  fromUnit: z.string().min(1).max(8),
  toUnit: z.string().min(1).max(8),
});

/**
 * `maintenance-cost` — recurring cost line items (category + amount +
 * frequency) → monthly/annual total (computed in the component). Categories
 * reuse the Expense module's `ExpenseCategory`.
 */
export const maintenanceCostInput = z.object({
  items: z
    .array(
      z.object({
        category: expenseCategoryEnum,
        amount: z.number().min(0).max(1_000_000),
        frequency: frequencyEnum,
      }),
    )
    .max(20),
});

/**
 * `food-consumption` — package weight + daily ration + current stock →
 * days of autonomy and reorder date (computed in the component). The optional
 * "create CONSUMABLE reminder" action uses the existing Reminder Engine API.
 */
export const foodConsumptionInput = z.object({
  packageWeightG: z.number().positive().max(100_000),
  dailyGramsG: z.number().positive().max(10_000),
  currentStockG: z.number().min(0).max(100_000),
});

/**
 * `food-plant-toxicity` — look up a food/plant name within an animal
 * category. Content (risk level + note) is curated in care-knowledge; this
 * just carries the query + category. No persistence.
 */
export const foodPlantToxicityInput = z.object({
  category: petCategoryEnum,
  query: z.string().min(1).max(120),
});

/**
 * `body-condition-score` — guided questionnaire answers + category → a 1–9
 * score (scale/questions are care-knowledge content; scoring in the
 * component). `answers` are option indices, one per question.
 */
export const bodyConditionScoreInput = z.object({
  category: petCategoryEnum,
  answers: z.array(z.number().int().min(0).max(10)).min(1).max(6),
});

/**
 * `reptile-environment-guide` — structured care content (no calculation): the
 * selected curated reptile profile whose target temperature/humidity ranges
 * are served by the care-knowledge module. `profileId` is a free string; the
 * valid set is the backend's curated content, not enumerated here.
 */
export const reptileEnvironmentGuideInput = z.object({
  profileId: z.string().min(1).max(64),
});

// ── Contract registry ─────────────────────────────────────────────────────────

/**
 * The authoritative map: tool `id` → its input contract. The `id` field of
 * each entry MUST equal its key (enforced by `service-contract.spec.ts`).
 *
 * `satisfies` validates the shape without widening the literal, so
 * `ServiceToolId` is derived from the keys and `ServiceToolInput<Id>` keeps
 * each tool's precise inferred input type.
 */
export const SERVICE_TOOL_CONTRACTS = {
  'dog-calorie-needs': {
    id: 'dog-calorie-needs',
    schemaVersion: 1,
    inputSchema: dogCalorieNeedsInput,
  },
  'aquarium-volume': {
    id: 'aquarium-volume',
    schemaVersion: 1,
    inputSchema: aquariumVolumeInput,
  },
  'reptile-environment-guide': {
    id: 'reptile-environment-guide',
    schemaVersion: 1,
    inputSchema: reptileEnvironmentGuideInput,
  },
  'pet-age-human-years': {
    id: 'pet-age-human-years',
    schemaVersion: 1,
    inputSchema: petAgeHumanYearsInput,
  },
  'pet-unit-converter': {
    id: 'pet-unit-converter',
    schemaVersion: 1,
    inputSchema: petUnitConverterInput,
  },
  'maintenance-cost': {
    id: 'maintenance-cost',
    schemaVersion: 1,
    inputSchema: maintenanceCostInput,
  },
  'food-consumption': {
    id: 'food-consumption',
    schemaVersion: 1,
    inputSchema: foodConsumptionInput,
  },
  'food-plant-toxicity': {
    id: 'food-plant-toxicity',
    schemaVersion: 1,
    inputSchema: foodPlantToxicityInput,
  },
  'body-condition-score': {
    id: 'body-condition-score',
    schemaVersion: 1,
    inputSchema: bodyConditionScoreInput,
  },
} as const satisfies Record<string, ServiceToolContract>;

/** The single key type for every tool. */
export type ServiceToolId = keyof typeof SERVICE_TOOL_CONTRACTS;

/** All known tool ids, as a runtime array (e.g. for iteration / seeding). */
export const SERVICE_TOOL_IDS = Object.keys(
  SERVICE_TOOL_CONTRACTS,
) as ServiceToolId[];

/** Precise, per-tool inferred input type. */
export type ServiceToolInput<Id extends ServiceToolId> = z.infer<
  (typeof SERVICE_TOOL_CONTRACTS)[Id]['inputSchema']
>;

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Narrowing type guard for an untrusted string (e.g. a route param). */
export function isServiceToolId(value: string): value is ServiceToolId {
  return Object.prototype.hasOwnProperty.call(SERVICE_TOOL_CONTRACTS, value);
}

/** Returns the contract for a known tool id. */
export function getServiceToolContract(
  id: ServiceToolId,
): (typeof SERVICE_TOOL_CONTRACTS)[ServiceToolId] {
  return SERVICE_TOOL_CONTRACTS[id];
}

/** The current input `schemaVersion` for a tool. */
export function serviceToolSchemaVersion(id: ServiceToolId): number {
  return SERVICE_TOOL_CONTRACTS[id].schemaVersion;
}

/**
 * Validates `input` against a tool's schema, throwing `ZodError` on failure.
 * Use server-side where invalid input is an exception.
 */
export function parseServiceToolInput<Id extends ServiceToolId>(
  id: Id,
  input: unknown,
): ServiceToolInput<Id> {
  return SERVICE_TOOL_CONTRACTS[id].inputSchema.parse(
    input,
  ) as ServiceToolInput<Id>;
}

/**
 * Non-throwing variant. Use client-side to validate persisted/MMKV-cached
 * inputs before recomputing a result.
 */
export function safeParseServiceToolInput<Id extends ServiceToolId>(
  id: Id,
  input: unknown,
): z.ZodSafeParseResult<ServiceToolInput<Id>> {
  return SERVICE_TOOL_CONTRACTS[id].inputSchema.safeParse(
    input,
  ) as z.ZodSafeParseResult<ServiceToolInput<Id>>;
}

/**
 * Whether a previously-persisted input (saved under `savedSchemaVersion`) is
 * still shape-compatible with the current contract. When this is `false` the
 * caller MUST discard the saved input rather than attempt to migrate it —
 * `schemaVersion` versions the shape, not the formula.
 */
export function isPersistedInputCompatible(
  id: ServiceToolId,
  savedSchemaVersion: number,
): boolean {
  return savedSchemaVersion === SERVICE_TOOL_CONTRACTS[id].schemaVersion;
}

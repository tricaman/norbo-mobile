/**
 * pet-event-schemas — shared Zod schemas for PetEvent polymorphic payload.
 *
 * Single source of truth for all 12 PetEventType-specific `extra` schemas.
 * Kept in sync between norbo-api and norbo-mobile: both copies must be
 * identical. When a future monorepo workspace is set up this file becomes
 * a proper internal package and the duplication disappears.
 *
 * Usage on the backend  : ZodValidationPipe(PetEventExtraSchemaByType[type])
 * Usage on the mobile   : zodResolver(buildEventFormSchema(type))
 */
import { z } from "zod";
import type { ZodType } from "zod";

// ── Enums ─────────────────────────────────────────────────────────────────────

export enum PetEventType {
  VACCINATION = "VACCINATION",
  VET_VISIT = "VET_VISIT",
  PARASITE_TREATMENT = "PARASITE_TREATMENT",
  GROOMING = "GROOMING",
  WEIGHT_RECORD = "WEIGHT_RECORD",
  WATER_PARAMETERS = "WATER_PARAMETERS",
  WATER_CHANGE = "WATER_CHANGE",
  MOLT = "MOLT",
  FEEDING_LOG = "FEEDING_LOG",
  MEDICATION = "MEDICATION",
  NOTE = "NOTE",
  INSURANCE = "INSURANCE",
  PASSING = "PASSING",
}

export enum PetEventStatus {
  SCHEDULED = "SCHEDULED",
  OCCURRED = "OCCURRED",
  CANCELLED = "CANCELLED",
}

/**
 * ExpenseCategory — single source of truth for expense classification.
 *
 * Bookkeeping-style taxonomy (intentionally coarser than PetEventType).
 * Multiple event types collapse onto the same expense category (e.g.
 * VACCINATION, VET_VISIT, PARASITE_TREATMENT, MEDICATION → VET).
 */
export enum ExpenseCategory {
  VET = "VET",
  FOOD = "FOOD",
  ACCESSORIES = "ACCESSORIES",
  GROOMING = "GROOMING",
  OTHER = "OTHER",
}

/**
 * PetCategory mirrored from pet-management domain entity.
 * Must be kept in sync with `PetCategory` in `pet.entity.ts`.
 */
export enum PetCategory {
  MAMMAL_DOG = "MAMMAL_DOG",
  MAMMAL_CAT = "MAMMAL_CAT",
  MAMMAL_SMALL = "MAMMAL_SMALL",
  BIRD = "BIRD",
  FISH_FRESHWATER = "FISH_FRESHWATER",
  FISH_SALTWATER = "FISH_SALTWATER",
  REPTILE = "REPTILE",
  AMPHIBIAN = "AMPHIBIAN",
  INVERTEBRATE = "INVERTEBRATE",
  EQUINE = "EQUINE",
  FARM = "FARM",
}

// ── Type-specific extra schemas ───────────────────────────────────────────────

export const VaccinationExtraSchema = z.object({
  vaccineName: z.string().min(1).max(120),
  batchNumber: z.string().max(60).optional(),
  nextDueDate: z.coerce.date().optional(),
  vetName: z.string().max(120).optional(),
});
export type VaccinationExtra = z.infer<typeof VaccinationExtraSchema>;

export const VetVisitExtraSchema = z.object({
  vetName: z.string().max(120).optional(),
  clinic: z.string().max(120).optional(),
  reason: z.string().min(1).max(500),
  diagnosis: z.string().max(2000).optional(),
  prescription: z.string().max(2000).optional(),
});
export type VetVisitExtra = z.infer<typeof VetVisitExtraSchema>;

export const ParasiteTreatmentExtraSchema = z.object({
  productName: z.string().min(1).max(120),
  treatmentType: z.enum(["INTERNAL", "EXTERNAL", "BOTH"]),
  nextDueDate: z.coerce.date().optional(),
  vetName: z.string().max(120).optional(),
});
export type ParasiteTreatmentExtra = z.infer<
  typeof ParasiteTreatmentExtraSchema
>;

export const GroomingExtraSchema = z.object({
  groomerName: z.string().max(120).optional(),
  services: z.array(z.string().max(80)).optional(),
  notes: z.string().max(1000).optional(),
});
export type GroomingExtra = z.infer<typeof GroomingExtraSchema>;

export const WeightRecordExtraSchema = z.object({
  /**
   * Canonical weight in integer milligrams.
   * Range covers from a few mg (baby invertebrates) up to ~5 t.
   * Clients MUST convert from their preferred display unit before submit.
   */
  weightMg: z.number().int().positive().max(5_000_000_000),
  notes: z.string().max(500).optional(),
});
export type WeightRecordExtra = z.infer<typeof WeightRecordExtraSchema>;

export const WaterParametersExtraSchema = z.object({
  ph: z.number().min(0).max(14).optional(),
  ammonia: z.number().min(0).optional(),
  nitrite: z.number().min(0).optional(),
  nitrate: z.number().min(0).optional(),
  temp: z.number().optional(),
  gh: z.number().min(0).optional(),
  kh: z.number().min(0).optional(),
  salinity: z.number().min(0).optional(),
});
export type WaterParametersExtra = z.infer<typeof WaterParametersExtraSchema>;

export const WaterChangeExtraSchema = z.object({
  volumeChangedPercent: z.number().min(0).max(100).optional(),
  productsUsed: z.array(z.string().max(80)).optional(),
  notes: z.string().max(1000).optional(),
});
export type WaterChangeExtra = z.infer<typeof WaterChangeExtraSchema>;

export const MoltExtraSchema = z.object({
  notes: z.string().max(1000).optional(),
});
export type MoltExtra = z.infer<typeof MoltExtraSchema>;

export const FeedingLogExtraSchema = z.object({
  foodType: z.string().max(120).optional(),
  amount: z.number().positive().optional(),
  unit: z.string().max(30).optional(),
  notes: z.string().max(1000).optional(),
});
export type FeedingLogExtra = z.infer<typeof FeedingLogExtraSchema>;

export const MedicationExtraSchema = z.object({
  medicineName: z.string().min(1).max(120),
  dosage: z.string().max(120).optional(),
  frequency: z.string().max(120).optional(),
  durationDays: z.number().int().positive().optional(),
  vetName: z.string().max(120).optional(),
});
export type MedicationExtra = z.infer<typeof MedicationExtraSchema>;

export const NoteExtraSchema = z.object({
  content: z.string().min(1).max(5000),
});
export type NoteExtra = z.infer<typeof NoteExtraSchema>;

// Insurance policies: provider, policy number, validity dates etc. are
// captured via the generic event fields (title / description / cost /
// occurredAt) for now. The dedicated `extra` schema is intentionally
// empty so the type exists end-to-end without prescribing a UI shape.
// Add fields here when the insurance form gains its own widgets.
export const InsuranceExtraSchema = z.object({});
export type InsuranceExtra = z.infer<typeof InsuranceExtraSchema>;

export const PassingExtraSchema = z.object({
  cause: z.string().max(500).optional(),
  vetName: z.string().max(120).optional(),
  location: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
});
export type PassingExtra = z.infer<typeof PassingExtraSchema>;

// ── Discriminator map ─────────────────────────────────────────────────────────

export const PetEventExtraSchemaByType: Record<PetEventType, ZodType> = {
  [PetEventType.VACCINATION]: VaccinationExtraSchema,
  [PetEventType.VET_VISIT]: VetVisitExtraSchema,
  [PetEventType.PARASITE_TREATMENT]: ParasiteTreatmentExtraSchema,
  [PetEventType.GROOMING]: GroomingExtraSchema,
  [PetEventType.WEIGHT_RECORD]: WeightRecordExtraSchema,
  [PetEventType.WATER_PARAMETERS]: WaterParametersExtraSchema,
  [PetEventType.WATER_CHANGE]: WaterChangeExtraSchema,
  [PetEventType.MOLT]: MoltExtraSchema,
  [PetEventType.FEEDING_LOG]: FeedingLogExtraSchema,
  [PetEventType.MEDICATION]: MedicationExtraSchema,
  [PetEventType.NOTE]: NoteExtraSchema,
  [PetEventType.INSURANCE]: InsuranceExtraSchema,
  [PetEventType.PASSING]: PassingExtraSchema,
};

/**
 * Validates and parses the `extra` payload for a given event type.
 * Throws a ZodError if the payload does not match the schema.
 */
export function validatePetEventExtra(
  type: PetEventType,
  extra: unknown,
): Record<string, unknown> {
  return PetEventExtraSchemaByType[type].parse(extra) as Record<
    string,
    unknown
  >;
}

// ── Category → available event types ─────────────────────────────────────────

export const EVENT_TYPES_BY_CATEGORY: Record<PetCategory, PetEventType[]> = {
  [PetCategory.MAMMAL_DOG]: [
    PetEventType.VACCINATION,
    PetEventType.VET_VISIT,
    PetEventType.PARASITE_TREATMENT,
    PetEventType.GROOMING,
    PetEventType.WEIGHT_RECORD,
    PetEventType.FEEDING_LOG,
    PetEventType.MEDICATION,
    PetEventType.NOTE,
    PetEventType.INSURANCE,
    PetEventType.PASSING,
  ],
  [PetCategory.MAMMAL_CAT]: [
    PetEventType.VACCINATION,
    PetEventType.VET_VISIT,
    PetEventType.PARASITE_TREATMENT,
    PetEventType.GROOMING,
    PetEventType.WEIGHT_RECORD,
    PetEventType.FEEDING_LOG,
    PetEventType.MEDICATION,
    PetEventType.NOTE,
    PetEventType.INSURANCE,
    PetEventType.PASSING,
  ],
  [PetCategory.MAMMAL_SMALL]: [
    PetEventType.VACCINATION,
    PetEventType.VET_VISIT,
    PetEventType.PARASITE_TREATMENT,
    PetEventType.WEIGHT_RECORD,
    PetEventType.FEEDING_LOG,
    PetEventType.MEDICATION,
    PetEventType.NOTE,
    PetEventType.INSURANCE,
    PetEventType.PASSING,
  ],
  [PetCategory.BIRD]: [
    PetEventType.VACCINATION,
    PetEventType.VET_VISIT,
    PetEventType.PARASITE_TREATMENT,
    PetEventType.WEIGHT_RECORD,
    PetEventType.FEEDING_LOG,
    PetEventType.MEDICATION,
    PetEventType.NOTE,
    PetEventType.INSURANCE,
    PetEventType.PASSING,
  ],
  [PetCategory.FISH_FRESHWATER]: [
    PetEventType.VET_VISIT,
    PetEventType.WATER_PARAMETERS,
    PetEventType.WATER_CHANGE,
    PetEventType.FEEDING_LOG,
    PetEventType.MEDICATION,
    PetEventType.NOTE,
    PetEventType.INSURANCE,
    PetEventType.PASSING,
  ],
  [PetCategory.FISH_SALTWATER]: [
    PetEventType.VET_VISIT,
    PetEventType.WATER_PARAMETERS,
    PetEventType.WATER_CHANGE,
    PetEventType.FEEDING_LOG,
    PetEventType.MEDICATION,
    PetEventType.NOTE,
    PetEventType.INSURANCE,
    PetEventType.PASSING,
  ],
  [PetCategory.REPTILE]: [
    PetEventType.VET_VISIT,
    PetEventType.WEIGHT_RECORD,
    PetEventType.MOLT,
    PetEventType.FEEDING_LOG,
    PetEventType.MEDICATION,
    PetEventType.NOTE,
    PetEventType.INSURANCE,
    PetEventType.PASSING,
  ],
  [PetCategory.AMPHIBIAN]: [
    PetEventType.VET_VISIT,
    PetEventType.WEIGHT_RECORD,
    PetEventType.WATER_PARAMETERS,
    PetEventType.WATER_CHANGE,
    PetEventType.FEEDING_LOG,
    PetEventType.MEDICATION,
    PetEventType.NOTE,
    PetEventType.INSURANCE,
    PetEventType.PASSING,
  ],
  [PetCategory.INVERTEBRATE]: [
    PetEventType.VET_VISIT,
    PetEventType.MOLT,
    PetEventType.FEEDING_LOG,
    PetEventType.MEDICATION,
    PetEventType.NOTE,
    PetEventType.INSURANCE,
    PetEventType.PASSING,
  ],
  [PetCategory.EQUINE]: [
    PetEventType.VACCINATION,
    PetEventType.VET_VISIT,
    PetEventType.PARASITE_TREATMENT,
    PetEventType.GROOMING,
    PetEventType.WEIGHT_RECORD,
    PetEventType.FEEDING_LOG,
    PetEventType.MEDICATION,
    PetEventType.NOTE,
    PetEventType.INSURANCE,
    PetEventType.PASSING,
  ],
  [PetCategory.FARM]: [
    PetEventType.VACCINATION,
    PetEventType.VET_VISIT,
    PetEventType.PARASITE_TREATMENT,
    PetEventType.WEIGHT_RECORD,
    PetEventType.FEEDING_LOG,
    PetEventType.MEDICATION,
    PetEventType.NOTE,
    PetEventType.INSURANCE,
    PetEventType.PASSING,
  ],
};

// ── Event capabilities (cost / reminder) ─────────────────────────────────────

/**
 * PetEventCapabilities — declares, per `PetEventType`, whether it can:
 *  - spawn an Expense (`hasCost`)
 *  - spawn a Reminder when scheduled in the future (`canSchedule`)
 *
 * `defaultExpenseCategory` is the suggested `ExpenseCategory` to pre-fill
 * when an Expense is generated from this event type. It MUST be `null`
 * iff `hasCost` is `false`.
 *
 * Single source of truth used by:
 *  - the EventForm UI (gating cost / reminder / "create expense" sections)
 *  - the expense creation flow (default category pre-fill)
 *  - the reminder engine listener on the API side
 */
export interface PetEventCapabilities {
  hasCost: boolean;
  canSchedule: boolean;
  defaultExpenseCategory: ExpenseCategory | null;
  /**
   * Whether the event type can be flagged as part of the pet's health
   * booklet (libretto). Only medical event types are eligible — the
   * EventForm shows the "add to booklet" toggle only when this is true.
   */
  bookletEligible: boolean;
  /**
   * Default value of the booklet toggle when creating an event of this
   * type. MUST be `false` when `bookletEligible` is `false`. Medical
   * events that naturally belong to the booklet (vaccinations, parasite
   * treatments) default to `true`.
   */
  bookletDefault: boolean;
}

export const PET_EVENT_CAPABILITIES: Record<
  PetEventType,
  PetEventCapabilities
> = {
  [PetEventType.VACCINATION]: {
    hasCost: true,
    canSchedule: true,
    defaultExpenseCategory: ExpenseCategory.VET,
    bookletEligible: true,
    bookletDefault: true,
  },
  [PetEventType.VET_VISIT]: {
    hasCost: true,
    canSchedule: true,
    defaultExpenseCategory: ExpenseCategory.VET,
    bookletEligible: true,
    bookletDefault: false,
  },
  [PetEventType.PARASITE_TREATMENT]: {
    hasCost: true,
    canSchedule: true,
    defaultExpenseCategory: ExpenseCategory.VET,
    bookletEligible: true,
    bookletDefault: true,
  },
  [PetEventType.MEDICATION]: {
    hasCost: true,
    canSchedule: true,
    defaultExpenseCategory: ExpenseCategory.VET,
    bookletEligible: true,
    bookletDefault: false,
  },
  [PetEventType.GROOMING]: {
    hasCost: true,
    canSchedule: true,
    defaultExpenseCategory: ExpenseCategory.GROOMING,
    bookletEligible: false,
    bookletDefault: false,
  },
  [PetEventType.INSURANCE]: {
    hasCost: true,
    canSchedule: true,
    defaultExpenseCategory: ExpenseCategory.OTHER,
    bookletEligible: false,
    bookletDefault: false,
  },
  [PetEventType.FEEDING_LOG]: {
    hasCost: true,
    canSchedule: false,
    defaultExpenseCategory: ExpenseCategory.FOOD,
    bookletEligible: false,
    bookletDefault: false,
  },
  [PetEventType.WATER_CHANGE]: {
    hasCost: false,
    canSchedule: true,
    defaultExpenseCategory: null,
    bookletEligible: false,
    bookletDefault: false,
  },
  [PetEventType.WEIGHT_RECORD]: {
    hasCost: false,
    canSchedule: false,
    defaultExpenseCategory: null,
    bookletEligible: false,
    bookletDefault: false,
  },
  [PetEventType.WATER_PARAMETERS]: {
    hasCost: false,
    canSchedule: false,
    defaultExpenseCategory: null,
    bookletEligible: false,
    bookletDefault: false,
  },
  [PetEventType.MOLT]: {
    hasCost: false,
    canSchedule: false,
    defaultExpenseCategory: null,
    bookletEligible: false,
    bookletDefault: false,
  },
  [PetEventType.NOTE]: {
    hasCost: false,
    canSchedule: false,
    defaultExpenseCategory: null,
    bookletEligible: false,
    bookletDefault: false,
  },
  [PetEventType.PASSING]: {
    hasCost: false,
    canSchedule: false,
    defaultExpenseCategory: null,
    bookletEligible: false,
    bookletDefault: false,
  },
};

export function eventCanHaveCost(type: PetEventType): boolean {
  return PET_EVENT_CAPABILITIES[type].hasCost;
}

export function eventCanSchedule(type: PetEventType): boolean {
  return PET_EVENT_CAPABILITIES[type].canSchedule;
}

export function defaultExpenseCategoryFor(
  type: PetEventType,
): ExpenseCategory | null {
  return PET_EVENT_CAPABILITIES[type].defaultExpenseCategory;
}

export function eventBookletEligible(type: PetEventType): boolean {
  return PET_EVENT_CAPABILITIES[type].bookletEligible;
}

export function eventBookletDefault(type: PetEventType): boolean {
  return PET_EVENT_CAPABILITIES[type].bookletDefault;
}

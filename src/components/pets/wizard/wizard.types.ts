import { PetCategory, Sex } from "@/types/pet.types";
import { z } from "zod";

/**
 * Single source of truth for the data accumulated through the wizard.
 * Backed by Zod so per-step validation and the final API call share
 * the same schema.
 */
export const petWizardSchema = z.object({
  category: z.nativeEnum(PetCategory),
  name: z.string().min(1).max(60),
  speciesId: z.string().nullable().optional(),
  speciesLabelFreetext: z.string().nullable().optional(),
  sex: z.nativeEnum(Sex).optional(),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "petWizard.birthDateInvalid")
    .nullable()
    .optional(),
  sterilized: z.boolean().nullable().optional(),
});

export type PetWizardValues = z.infer<typeof petWizardSchema>;

/**
 * Wizard step identifier. `category` is the entry point (no progress
 * indicator); the five form steps `name → species → sex → birthDate
 * → sterilized` are gated by the progress dots; `confirm` is the
 * post-submit success screen.
 */
export type PetWizardStep =
  | "category"
  | "name"
  | "species"
  | "sex"
  | "birthDate"
  | "sterilized"
  | "confirm";

/** Ordered list of the form steps that show progress dots. */
export const FORM_STEPS: readonly PetWizardStep[] = [
  "name",
  "species",
  "sex",
  "birthDate",
  "sterilized",
];

/** Number of dots rendered in `PetWizardHeader`. */
export const TOTAL_FORM_STEPS = FORM_STEPS.length;

// ⚠️  AUTO-GENERATED — DO NOT EDIT.
// Source of truth: norbo-api/src/shared/pet-booklet-schema/index.ts
// Regenerate with `pnpm sync:contracts` in norbo-api.

import { z } from 'zod';

/**
 * PetBooklet input contract — shared between norbo-api (validation) and
 * norbo-mobile (form). Framework-free: only `zod`.
 *
 * Every field is optional/nullable: the booklet is a sparse identity
 * record where unset fields simply stay empty. Date fields are coerced
 * so a `Date` instance (mobile form) or an ISO string (HTTP body) are
 * both accepted.
 */
export const PetBookletSchema = z.object({
  microchipNumber: z.string().max(50).nullish(),
  microchipImplantedAt: z.coerce.date().nullish(),
  microchipLocation: z.string().max(100).nullish(),
  tattooNumber: z.string().max(50).nullish(),
  passportNumber: z.string().max(50).nullish(),
  registrationNumber: z.string().max(50).nullish(),
  pedigreeNumber: z.string().max(50).nullish(),
  vetName: z.string().max(120).nullish(),
  vetClinic: z.string().max(120).nullish(),
  vetPhone: z.string().max(40).nullish(),
  insuranceProvider: z.string().max(120).nullish(),
  insurancePolicyNumber: z.string().max(80).nullish(),
  bloodType: z.string().max(20).nullish(),
  allergies: z.array(z.string().max(100)).max(50).optional(),
  chronicConditions: z.string().max(2000).nullish(),
  notes: z.string().max(2000).nullish(),
});

export type PetBookletInput = z.infer<typeof PetBookletSchema>;

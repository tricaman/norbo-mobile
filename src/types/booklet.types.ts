/**
 * Pet Health Booklet ("libretto") — identity record returned by
 * `GET /pets/:petId/booklet`. Mirrors the API presenter (dates are
 * serialized as ISO strings). The vaccination / treatment registry is
 * NOT here: those are timeline events tagged with `includeInBooklet`.
 */
export interface PetBooklet {
  id: string;
  petId: string;
  microchipNumber: string | null;
  microchipImplantedAt: string | null;
  microchipLocation: string | null;
  tattooNumber: string | null;
  passportNumber: string | null;
  registrationNumber: string | null;
  pedigreeNumber: string | null;
  vetName: string | null;
  vetClinic: string | null;
  vetPhone: string | null;
  insuranceProvider: string | null;
  insurancePolicyNumber: string | null;
  bloodType: string | null;
  allergies: string[];
  chronicConditions: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Body for `PUT /pets/:petId/booklet`. Every field is optional: omitted
 * fields are left unchanged, `null` clears a field. Validated server-side
 * against the shared `PetBookletSchema`.
 */
export interface UpdatePetBookletInput {
  microchipNumber?: string | null;
  microchipImplantedAt?: string | null;
  microchipLocation?: string | null;
  tattooNumber?: string | null;
  passportNumber?: string | null;
  registrationNumber?: string | null;
  pedigreeNumber?: string | null;
  vetName?: string | null;
  vetClinic?: string | null;
  vetPhone?: string | null;
  insuranceProvider?: string | null;
  insurancePolicyNumber?: string | null;
  bloodType?: string | null;
  allergies?: string[];
  chronicConditions?: string | null;
  notes?: string | null;
}

import type { PetExpenseSummary } from "@/types/pet-expense.types";
import { api } from "./api";

const base = (petId: string) =>
  `/pets/${encodeURIComponent(petId)}/expenses`;

export const petExpensesApi = {
  summary: (petId: string, year: number) =>
    api.get<PetExpenseSummary>(`${base(petId)}/summary`, { params: { year } }),
} as const;

import type {
  CreatePetEventInput,
  PetEvent,
  PetEventTimeline,
  UpdatePetEventInput,
} from "@/types/pet-event.types";
import { api } from "./api";

const base = (petId: string) => `/pets/${encodeURIComponent(petId)}/events`;

export const petEventsApi = {
  list: (petId: string, params?: { cursor?: string; limit?: number }) =>
    api.get<PetEventTimeline>(base(petId), { params }),

  get: (petId: string, eventId: string) =>
    api.get<PetEvent>(`${base(petId)}/${encodeURIComponent(eventId)}`),

  create: (petId: string, input: CreatePetEventInput) =>
    api.post<PetEvent>(base(petId), input),

  update: (petId: string, eventId: string, input: UpdatePetEventInput) =>
    api.patch<PetEvent>(`${base(petId)}/${encodeURIComponent(eventId)}`, input),

  complete: (petId: string, eventId: string) =>
    api.post<PetEvent>(
      `${base(petId)}/${encodeURIComponent(eventId)}/complete`,
    ),

  cancel: (petId: string, eventId: string) =>
    api.post<PetEvent>(`${base(petId)}/${encodeURIComponent(eventId)}/cancel`),

  delete: (petId: string, eventId: string) =>
    api.delete(`${base(petId)}/${encodeURIComponent(eventId)}`),

  /**
   * Cross-pet feed of the authenticated user's upcoming SCHEDULED
   * events, ordered by `scheduledFor` ascending. Powers the home
   * screen "next things to do" section.
   */
  listUpcoming: (params?: { limit?: number }) =>
    api.get<PetEvent[]>("/me/events/upcoming", { params }),

  /**
   * Cross-pet feed of every SCHEDULED event the user owns, ordered by
   * `scheduledFor` ascending (overdue first). Powers the dedicated
   * Reminder tab; client groups/filters locally.
   */
  listReminders: () => api.get<PetEvent[]>("/me/events/reminders"),
} as const;

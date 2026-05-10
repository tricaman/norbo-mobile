/**
 * Identity & Access — user preferences (Zod schemas).
 *
 * MIRROR of `norbo-api/src/modules/auth/schemas/preferences.schema.ts`.
 * Keep in sync byte-for-byte until we extract a shared workspace
 * package. Any change here MUST be applied to the backend file too.
 */
import { z } from "zod";

export const SUPPORTED_LANGUAGES = ["it"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const SUPPORTED_THEMES = ["light", "dark", "system"] as const;
export type SupportedTheme = (typeof SUPPORTED_THEMES)[number];

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

export const quietHoursSchema = z
  .object({
    start: z.string().regex(HHMM, "Expected HH:MM (24h)"),
    end: z.string().regex(HHMM, "Expected HH:MM (24h)"),
  })
  .strict();

export type QuietHours = z.infer<typeof quietHoursSchema>;

export const notificationPreferencesSchema = z
  .object({
    healthReminders: z.boolean().default(true),
    maintenanceReminders: z.boolean().default(true),
    quietHours: quietHoursSchema.nullable().default(null),
  })
  .strict();

export type NotificationPreferences = z.infer<
  typeof notificationPreferencesSchema
>;

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  healthReminders: true,
  maintenanceReminders: true,
  quietHours: null,
};

export const updatePreferencesSchema = z
  .object({
    notificationPreferences: notificationPreferencesSchema.optional(),
    preferredLanguage: z.enum(SUPPORTED_LANGUAGES).optional(),
    theme: z.enum(SUPPORTED_THEMES).optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one preference field is required",
  });

export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;

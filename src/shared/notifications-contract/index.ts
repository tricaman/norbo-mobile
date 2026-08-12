// ⚠️  AUTO-GENERATED — DO NOT EDIT.
// Source of truth: norbo-api/src/shared/notifications-contract/index.ts
// Regenerate with `pnpm sync:contracts` in norbo-api.

/**
 * notifications-contract — the shared contract for the in-app Notifications
 * inbox (persisted mirror of every push sent via
 * `NotificationDeliveryService.deliver()`).
 *
 * Single source of truth, defined once and consumed by BOTH norbo-api and
 * norbo-mobile. Framework-free on purpose: NO Nest, NO React, only `zod`.
 * The mobile copy under `norbo-mobile/src/shared/notifications-contract` is
 * generated from this file by `scripts/sync-shared-contracts.mjs` (run
 * `pnpm sync:contracts` in norbo-api) — never edit it by hand.
 *
 * `data` mirrors `DeliverNotificationCommand.data` verbatim (the same
 * free-form string map every push producer already sends to the Notifee
 * client) so the mobile app can reuse its existing `getNavTargetFromData`
 * routing table to resolve an in-app link from an inbox row, instead of a
 * second parallel deep-link mechanism.
 */
import { z } from 'zod';

/**
 * Push `data` key carrying the id of the inbox row mirrored for that push.
 * Injected by `NotificationDeliveryService.deliver()` right after the row is
 * recorded; the mobile push-tap handlers read it to mark the row read
 * (`PATCH /me/notifications/:id/read`), so tapping the OS notification and
 * tapping the same entry in the in-app inbox leave the same read state.
 * Pushes sent before this key existed simply lack it — handlers must treat
 * it as optional.
 */
export const INBOX_NOTIFICATION_ID_KEY = 'inboxNotificationId';

export const inboxNotificationSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  data: z.record(z.string(), z.string()).nullable(),
  createdAt: z.string(),
  readAt: z.string().nullable(),
});

export type InboxNotification = z.infer<typeof inboxNotificationSchema>;

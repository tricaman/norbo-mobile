/**
 * Invite types — re-exported from the generated shared contract so the app
 * imports from `@/types/*`, never from `@/shared` directly.
 */
import type {
  InviteStatus,
  InviteSummary,
  InviteView,
  SendInvitePayload,
} from "@/shared/invites-contract";

export type { InviteStatus, InviteSummary, InviteView, SendInvitePayload };

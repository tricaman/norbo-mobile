import type {
  InviteSummary,
  InviteView,
  SendInvitePayload,
} from "@/types/invite.types";
import { api } from "./api";

export const invitesApi = {
  list: () => api.get<InviteSummary>("/me/invites"),
  send: (payload: SendInvitePayload) =>
    api.post<InviteView>("/me/invites", payload),
} as const;

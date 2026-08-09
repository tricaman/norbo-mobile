import { useMutation } from "@/hooks/useMutation";
import { invitesApi } from "@/services/invites.api";
import type { SendInvitePayload } from "@/types/invite.types";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const KEYS = {
  list: () => ["invites"] as const,
};

export function useInvites() {
  return useQuery({
    queryKey: KEYS.list(),
    queryFn: () => invitesApi.list().then((r) => r.data),
  });
}

export function useSendInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SendInvitePayload) =>
      invitesApi.send(payload).then((r) => r.data),
    // The error toast carries the server message, which is where the real
    // feedback lives: already invited, daily cap reached, or your own address.
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: KEYS.list() });
      // A conversion can unlock the referral badge, but only later — when the
      // friend actually signs up. Nothing to invalidate here.
    },
  });
}

export const INVITE_QUERY_KEYS = KEYS;

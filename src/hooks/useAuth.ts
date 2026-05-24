import { queryClient } from "@/app/_layout";
import { AUTH_CALLBACK_URL } from "@/constants/config";
import { authApi } from "@/services/auth.api";
import { unregisterPushToken } from "@/services/push-registration";
import { useAuthStore } from "@/stores/auth.store";
import type { SocialProvider } from "@/types/auth.types";
import { haptics } from "@/utils/haptics";
import * as WebBrowser from "expo-web-browser";
import { useCallback } from "react";

WebBrowser.maybeCompleteAuthSession();

export function useAuth() {
  const { setUser, setSessionToken, clearAuth } = useAuthStore();

  /**
   * After any successful login, fetch the current user.
   */
  const finalizeLogin = useCallback(async () => {
    const meRes = await authApi.me();
    setUser(meRes.data);
    haptics.success();
  }, [setUser]);

  const verifyOtp = useCallback(async (email: string, otp: string) => {
    await authApi.verifyOtp({ email, otp });
  }, []);

  const completeSignIn = useCallback(async () => {
    await finalizeLogin();
  }, [finalizeLogin]);

  const signInWithOtp = useCallback(
    async (email: string, otp: string) => {
      await verifyOtp(email, otp);
      await completeSignIn();
    },
    [verifyOtp, completeSignIn],
  );

  const signInWithSocial = useCallback(
    async (provider: SocialProvider) => {
      // Open the backend redirect URL directly in the system browser.
      // This keeps the OAuth state cookie in the same browsing context as
      // the provider callback, preventing state_mismatch errors.
      const redirectUrl = authApi.getSocialRedirectUrl(
        provider,
        AUTH_CALLBACK_URL,
      );

      const result = await WebBrowser.openAuthSessionAsync(
        redirectUrl,
        AUTH_CALLBACK_URL,
      );

      if (result.type !== "success") {
        return;
      }

      // The backend appends session_token to the deep-link URL so the
      // mobile HTTP client can authenticate (browser cookies aren't shared).
      const url = new URL(result.url);
      const sessionToken = url.searchParams.get("session_token");
      if (sessionToken) {
        setSessionToken(decodeURIComponent(sessionToken));
      }

      await finalizeLogin();
    },
    [finalizeLogin, setSessionToken],
  );

  const signOut = useCallback(async () => {
    await unregisterPushToken();
    await authApi.signOut();
    clearAuth();
    queryClient.clear();
    haptics.light();
  }, [clearAuth]);

  const deleteAccount = useCallback(
    async (email: string) => {
      await authApi.deleteAccount(email);
      clearAuth();
      queryClient.clear();
    },
    [clearAuth],
  );

  const sendOtp = useCallback(async (email: string) => {
    await authApi.sendOtp({ email, type: "sign-in" });
    haptics.light();
  }, []);

  return {
    signInWithOtp,
    verifyOtp,
    completeSignIn,
    signInWithSocial,
    signOut,
    deleteAccount,
    sendOtp,
  };
}

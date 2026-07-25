import { queryClient } from "@/app/_layout";
import { AUTH_CALLBACK_URL } from "@/constants/config";
import { authApi } from "@/services/auth.api";
import { unregisterPushToken } from "@/services/push-registration";
import { useAuthStore } from "@/stores/auth.store";
import { useNewsReadStore } from "@/stores/news-read.store";
import type { SocialProvider } from "@/types/auth.types";
import { haptics } from "@/utils/haptics";
import * as WebBrowser from "expo-web-browser";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

WebBrowser.maybeCompleteAuthSession();

export function useAuth() {
  const { setUser, setSessionToken, clearAuth } = useAuthStore();
  const { t } = useTranslation();

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
      if (!sessionToken) {
        // Failed OAuth callback: the backend redirects to the deep link
        // with ?error=… and no token. Calling /auth/me now would just 401.
        console.warn(
          "[auth] social callback without session_token:",
          url.searchParams.get("error"),
        );
        throw new Error(t("auth.socialLoginFailed"));
      }
      setSessionToken(decodeURIComponent(sessionToken));

      await finalizeLogin();
    },
    [finalizeLogin, setSessionToken, t],
  );

  const signOut = useCallback(async () => {
    // Server-side sign-out + token cleanup are best-effort: if the session is
    // already expired/revoked they 401, and the network can fail outright.
    // Neither must block the local logout — otherwise a dead session traps the
    // user in a "logged in" state with no way out (sign-out itself needs auth).
    // So we always clear local state in `finally`, regardless of the outcome.
    try {
      await unregisterPushToken();
      await authApi.signOut();
    } catch (err) {
      console.warn("[auth] signOut server call failed (clearing anyway):", err);
    } finally {
      clearAuth();
      useNewsReadStore.getState().reset();
      queryClient.clear();
      haptics.light();
    }
  }, [clearAuth]);

  const deleteAccount = useCallback(
    async (email: string) => {
      await authApi.deleteAccount(email);
      clearAuth();
      useNewsReadStore.getState().reset();
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

import { queryClient } from "@/app/_layout";
import { AUTH_CALLBACK_URL } from "@/constants/config";
import { authApi } from "@/services/auth.api";
import { unregisterPushToken } from "@/services/push-registration";
import { useAuthStore } from "@/stores/auth.store";
import { useNewsReadStore } from "@/stores/news-read.store";
import type { SocialProvider } from "@/types/auth.types";
import { haptics } from "@/utils/haptics";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
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

  const verifyOtp = useCallback(
    async (email: string, otp: string) => {
      const res = await authApi.verifyOtp({ email, otp });

      // Store the session token exactly like the social/Apple flows do. The
      // axios client sets `withCredentials: false`, so the Set-Cookie on this
      // response is dropped by the native stack: without persisting the token
      // here the very next call (`/auth/me` in completeSignIn) goes out with no
      // Cookie header and 401s — which surfaces on the OTP screen as if the
      // code itself had been rejected.
      //
      // A 200 without a token means the backend contract changed; fail loudly
      // rather than letting it degrade into a confusing 401. The message is the
      // provider-neutral "sign-in failed, please try again" in every locale.
      if (!res.data.session_token) {
        throw new Error(t("auth.socialLoginFailed"));
      }
      setSessionToken(res.data.session_token);
    },
    [setSessionToken, t],
  );

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

  const signInWithAppleNative = useCallback(async () => {
    // Anti-replay nonce: Apple embeds the SHA-256 hash of the nonce we pass in
    // the identity token, and the backend verifies it. We send Apple the HASH
    // and the backend the RAW value (BetterAuth re-hashes and compares).
    const rawNonce = Crypto.randomUUID();
    const hashedNonce = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      rawNonce,
    );

    let credential: AppleAuthentication.AppleAuthenticationCredential;
    try {
      credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });
    } catch (err) {
      // The user dismissed the sheet — not an error, just abort silently so
      // the caller doesn't surface a scary message.
      if ((err as { code?: string })?.code === "ERR_REQUEST_CANCELED") {
        return;
      }
      throw err;
    }

    if (!credential.identityToken) {
      throw new Error(t("auth.socialLoginFailed"));
    }

    // Apple returns name/email ONLY on the first consent; forward them so the
    // backend can seed the user. Subsequent logins omit them (user exists).
    const res = await authApi.signInWithAppleNative({
      identityToken: credential.identityToken,
      nonce: rawNonce,
      name: credential.fullName
        ? {
            firstName: credential.fullName.givenName,
            lastName: credential.fullName.familyName,
          }
        : undefined,
      email: credential.email,
    });

    setSessionToken(res.data.session_token);
    await finalizeLogin();
  }, [finalizeLogin, setSessionToken, t]);

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
    signInWithAppleNative,
    signOut,
    deleteAccount,
    sendOtp,
  };
}

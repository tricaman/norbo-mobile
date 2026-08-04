import type {
  AppleNativeSignInPayload,
  AuthUser,
  OtpSendPayload,
  OtpVerifyPayload,
} from "@/types/auth.types";
import { api } from "./api";

export const authApi = {
  /**
   * Sign out. Clears the session cookie on the backend.
   */
  signOut: () => api.post("/auth/sign-out"),

  /**
   * Get current authenticated user.
   * Returns 401 if no session cookie.
   */
  me: () => api.get<AuthUser>("/auth/me"),

  /**
   * Send OTP to email.
   * type: 'sign-in' for passwordless login
   *       'email-verification' for verifying a new account
   */
  sendOtp: (payload: OtpSendPayload) => api.post("/auth/otp/send", payload),

  /**
   * Verify OTP. On success the backend returns the signed session cookie value
   * in the body as `session_token` (same hand-off as Apple-native below). The
   * caller MUST store it: this axios client runs with `withCredentials: false`,
   * so the Set-Cookie on this response is never kept and auth travels only
   * through the manual Cookie header built from the store (see services/api.ts).
   *
   * Not to be confused with BetterAuth's own `token` field, also present in the
   * body — that's the bare token without the signature the backend validates.
   */
  verifyOtp: (payload: OtpVerifyPayload) =>
    api.post<{ session_token: string; user: AuthUser }>(
      "/auth/sign-in/email-otp",
      payload,
    ),

  /**
   * Native Sign in with Apple (iOS sheet). Sends the Apple identity token +
   * RAW nonce; the backend verifies it and returns the session token in the
   * body (the system browser cookie isn't shared with this axios client).
   */
  signInWithAppleNative: (payload: AppleNativeSignInPayload) =>
    api.post<{ session_token: string; user: AuthUser }>(
      "/auth/sign-in/apple-native",
      payload,
    ),

  /**
   * Record the user's acceptance of the Terms of Service (EULA).
   * Returns the updated own profile with termsAcceptedAt set.
   */
  acceptTerms: () => api.post<AuthUser>("/auth/accept-terms"),

  /**
   * Record the user's acceptance of the Tools & Calculators Disclaimer.
   * Returns the updated own profile with toolsDisclaimerAcceptedAt set.
   */
  acceptToolsDisclaimer: () =>
    api.post<AuthUser>("/auth/accept-tools-disclaimer"),

  /**
   * Permanently delete the authenticated user's account.
   * The server verifies the provided email matches before deleting.
   */
  deleteAccount: (email: string) => api.delete("/auth/me", { data: { email } }),

  /**
   * Build the GET redirect URL for mobile social OAuth.
   *
   * Instead of POSTing to /auth/sign-in/social (which sets the state
   * cookie in the axios context, causing state_mismatch when the callback
   * arrives from the system browser), the mobile opens this URL directly
   * in expo-web-browser. The backend sets the state cookie in the browser
   * context and 302-redirects to the provider.
   */
  getSocialRedirectUrl: (provider: string, callbackURL: string): string => {
    const base = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";
    const params = new URLSearchParams({ provider, callbackURL });
    return `${base}/auth/social-redirect?${params.toString()}`;
  },
} as const;

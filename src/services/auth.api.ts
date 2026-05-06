import type {
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
   * Verify OTP. On success, backend sets session cookie.
   */
  verifyOtp: (payload: OtpVerifyPayload) =>
    api.post<{ user: AuthUser }>("/auth/sign-in/email-otp", payload),

  /**
   * Record the user's acceptance of the Terms of Service (EULA).
   * Returns the updated own profile with termsAcceptedAt set.
   */
  acceptTerms: () => api.post<AuthUser>("/auth/accept-terms"),

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

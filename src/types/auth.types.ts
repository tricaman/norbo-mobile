import type {
  NotificationPreferences,
  SupportedLanguage,
  SupportedTheme,
} from "./preferences.schema";

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  emailVerified: boolean;
  avatarUrl?: string | null;
  photoUrl?: string | null;
  /**
   * ISO-8601 timestamp of the user's acceptance of the Terms of Service.
   * Null until the user accepts — the app forces the onboarding TOS
   * screen and blocks all other navigation while this is null.
   */
  termsAcceptedAt?: string | null;
  /**
   * ISO-8601 timestamp of the user's acceptance of the Tools & Calculators
   * Disclaimer. Null until accepted — the app gates the user on the tools
   * disclaimer onboarding screen (right after the EULA) while this is null.
   */
  toolsDisclaimerAcceptedAt?: string | null;

  // ── Identity & Access — preferences (mirrors backend OwnProfile) ─────
  notificationPreferences: NotificationPreferences;
  preferredLanguage: SupportedLanguage;
  theme: SupportedTheme;
}

export interface OtpSendPayload {
  email: string;
  type: "sign-in" | "email-verification" | "forget-password";
}

export interface OtpVerifyPayload {
  email: string;
  otp: string;
}

export type SocialProvider = "google" | "facebook" | "microsoft" | "apple";

export interface SocialSignInPayload {
  provider: SocialProvider;
  callbackURL: string;
}

/**
 * Payload for the native Sign in with Apple flow (iOS sheet).
 *
 * `nonce` is the RAW nonce — the native sheet was given its SHA-256 hash, and
 * the backend forwards the raw value to BetterAuth (which re-hashes it). Apple
 * returns `name`/`email` only on the FIRST consent, so both are optional and
 * sent only when present, to seed the user on initial sign-up.
 */
export interface AppleNativeSignInPayload {
  identityToken: string;
  nonce: string;
  name?: { firstName?: string | null; lastName?: string | null };
  email?: string | null;
}

export interface SocialSignInResponse {
  url: string;
  redirect: boolean;
}

export type AuthScreen = "landing" | "email-input" | "otp-verify";

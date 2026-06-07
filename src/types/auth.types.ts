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

export type SocialProvider = "google" | "facebook" | "microsoft";

export interface SocialSignInPayload {
  provider: SocialProvider;
  callbackURL: string;
}

export interface SocialSignInResponse {
  url: string;
  redirect: boolean;
}

export type AuthScreen = "landing" | "email-input" | "otp-verify";

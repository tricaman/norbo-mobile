import axios from "axios";
import { useAuthStore } from "@/stores/auth.store";
import { useLanguageStore } from "@/stores/language.store";

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000",
  withCredentials: true,
  timeout: 10_000,
  headers: { "Content-Type": "application/json" },
});

// ── Inject session cookie ──────────────────────────────────────────
// The system browser used for OAuth doesn't share cookies with axios.
// We store the session token received from the deep-link redirect and
// attach it as a Cookie header on every request.
api.interceptors.request.use((config) => {
  const { sessionToken } = useAuthStore.getState();
  if (sessionToken) {
    // Send both prefixed and unprefixed names: in production BetterAuth
    // sets `useSecureCookies=true` which prefixes the cookie with
    // `__Secure-`, while in development it uses the plain name.
    config.headers.set(
      "Cookie",
      `better-auth.session_token=${sessionToken}; __Secure-better-auth.session_token=${sessionToken}`,
    );
  }

  const { language } = useLanguageStore.getState();
  config.headers.set("Accept-Language", language);

  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().clearAuth();
    }
    return Promise.reject(err);
  },
);


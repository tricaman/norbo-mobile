import axios from "axios";
import { useAuthStore } from "@/stores/auth.store";
import { useLanguageStore } from "@/stores/language.store";

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000",
  // Auth is driven entirely by the manual Cookie header set in the request
  // interceptor below. We must NOT also let the native HTTP stack (CFNetwork
  // on iOS) attach its own cookie store: after an Apple/OAuth sign-in it holds
  // a `session_data` cookie whose value it concatenates onto ours with a
  // comma, producing a malformed Cookie header that BetterAuth can't parse
  // (→ intermittent 401 on /auth/me). Disabling credentials keeps a single,
  // well-formed Cookie header under our control.
  withCredentials: false,
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
      // Only log out if the rejected request carried the *current* session
      // token. Right after a re-login, in-flight requests sent with the
      // old (or no) token can still resolve as 401 — those stragglers must
      // not wipe the freshly created session.
      const { sessionToken } = useAuthStore.getState();
      const sentCookie = err.config?.headers?.Cookie as string | undefined;
      if (sessionToken && sentCookie?.includes(sessionToken)) {
        useAuthStore.getState().clearAuth();
      }
    }
    return Promise.reject(err);
  },
);


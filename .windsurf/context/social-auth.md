## Social OAuth flow (norbo-mobile)

### Overview

Social login (Google, Facebook, Microsoft) uses `expo-web-browser` + `WebBrowser.openAuthSessionAsync()`. The backend (norbo-api / BetterAuth) handles the full OAuth handshake and sets an httpOnly session cookie on success. The mobile client never touches OAuth state, codes, or tokens directly.

### Flow

```
1. User taps social button
2. App calls POST /auth/sign-in/{provider}
   Body: { callbackURL: "dit://auth/callback" }
   Response: { url: "https://accounts.google.com/..." }

3. App opens: WebBrowser.openAuthSessionAsync(url, "dit://auth/callback")

4. User authorises on provider site
   → Provider redirects to GET /auth/callback/{provider}?code=xxx&state=xxx
   → Backend verifies state, creates/finds user, creates session
   → Backend redirects to dit://auth/callback

5. WebBrowser resolves with result.type === 'success'

6. App calls finalizeLogin():
   - GET /auth/me          → user data (parallel)
   - POST /auth/ws-token   → wsToken (parallel)
   - setUser() + setWsToken() → isAuthed becomes true
   - Root navigator switches to main app automatically
```

### Callback URL

```typescript
// src/constants/config.ts
export const AUTH_CALLBACK_URL = 'dit://auth/callback';
```

Must match exactly in: app code, backend `trustedOrigins`, and each OAuth provider console.

### Supported providers

```typescript
type SocialProvider = 'google' | 'facebook' | 'microsoft';
```

### Key implementation files

- `src/hooks/useAuth.ts` — `signInWithSocial(provider)` + `finalizeLogin()`
- `src/services/auth.api.ts` — `getSocialUrl`, `me`, `getWsToken`
- `src/constants/config.ts` — `AUTH_CALLBACK_URL`

---

## Backend requirements (norbo-api / BetterAuth)

### BetterAuth config essentials

```typescript
export const auth = betterAuth({
  baseURL: process.env.BASE_URL,

  trustedOrigins: [
    'dit://auth/callback',
    'http://localhost:3000',
  ],

  socialProviders: {
    google:    { clientId: process.env.GOOGLE_CLIENT_ID!,    clientSecret: process.env.GOOGLE_CLIENT_SECRET! },
    facebook:  { clientId: process.env.FACEBOOK_CLIENT_ID!,  clientSecret: process.env.FACEBOOK_CLIENT_SECRET! },
    microsoft: { clientId: process.env.MICROSOFT_CLIENT_ID!, clientSecret: process.env.MICROSOFT_CLIENT_SECRET! },
  },

  account: {
    storeStateStrategy: 'cookie', // prevents state_mismatch on mobile
  },

  advanced: {
    useSecureCookies: process.env.NODE_ENV === 'production',
  },
});
```

### OAuth provider redirect URI config

Each provider console must register **both** URIs:

| Provider | Backend callback URI | Mobile deep link |
|---|---|---|
| Google | `http://localhost:3000/auth/callback/google` | `dit://auth/callback` |
| Facebook | `http://localhost:3000/auth/callback/facebook` | `dit://auth/callback` |
| Microsoft (web) | `http://localhost:3000/auth/callback/microsoft` | — |
| Microsoft (mobile) | — | `dit://auth/callback` |

### CORS

```typescript
app.enableCors({
  origin: ['http://localhost:3000', 'dit://auth/callback'],
  credentials: true,
});
```

---

## Troubleshooting

### `state_mismatch` error

**Most common cause on mobile**: BetterAuth defaults to storing OAuth state in the database. Mobile browsers don't reliably send the state cookie back during the OAuth redirect chain.

**Fix**: set `account.storeStateStrategy: 'cookie'` in the BetterAuth config (see above).

**Other causes**:
- `AUTH_CALLBACK_URL` in the app doesn't exactly match `trustedOrigins` in the backend
- The OAuth redirect URI registered in the provider console differs from what the backend sends

### WebBrowser doesn't redirect back

- Verify `app.json` has `"scheme": "dit"`
- Verify the backend redirects to `dit://auth/callback` (not a mismatched URL)
- On Android, check that `expo-linking` is correctly configured

### Session cookie not sent

- Verify `withCredentials: true` on the axios instance in `src/services/api.service.ts`
- Verify CORS `credentials: true` on the backend
- The `Set-Cookie` header must arrive on the `/auth/callback/:provider` response

### WS connection fails after social login

- `finalizeLogin()` calls `POST /auth/ws-token` in parallel with `GET /auth/me` — check both succeed
- WS token lifetime is 15 min; `useWebSocket` auto-fetches a fresh one when `isAuthed && !wsToken`

---

## Security rules

- httpOnly session cookie — never accessible to JS
- WS token stored in Zustand memory only — never persisted to MMKV
- Auto-logout on 401 via axios interceptor
- Never hardcode OAuth credentials in the frontend

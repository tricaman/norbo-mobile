---
trigger: model_decision
description: "Full architecture of norbo-mobile: navigation, state, WebSocket, notifications. Read before changes to service layer."
---

> LIVING DOCUMENT — update this file whenever you:
> introduce a new pattern, convention, or architectural decision;
> discover a library behaviour that differs from what is written here;
> add a new dependency that has rules worth capturing;
> fix a bug caused by violating a rule that is not yet documented.

# Architecture — norbo-mobile

## Navigation

- Expo Router (file-based routing) in `src/app/`. All screens are domain-grouped — no flat files at the root level.
- Auth gate: unauthenticated users see login screens only. Authenticated users see the main tab navigator.

Route map:

- `(auth)/` — login/OTP screens
- `(tabs)/` — tab navigator: `dits`, `contacts`, `profile`, `settings`
- `dit/[userId]` — dit detail (main feature)
- `contacts/[userId]/index` — view another user's profile
- `contacts/[userId]/add` — add-contact form
- `settings/account/index` — account info hub
- `settings/account/username` — edit username
- `settings/account/name` — edit display name
- `settings/account/bio` — edit bio
- `settings/language` — language picker

Navigation rules:

- Never add a screen at `src/app/` root — always nest under its domain group.
- Every `<Stack.Screen>` in `_layout.tsx` must use the full path segment (e.g. `settings/account/username`).
- No intermediate `_layout.tsx` unless a nested Stack is genuinely needed.
- Typed paths only: `router.push("/settings/account")` — no string literals to dead routes.

## Zustand Store Map

| Store               | Owned State                                                     | Updates From                                   |
| ------------------- | --------------------------------------------------------------- | ---------------------------------------------- |
| `auth.store.ts`     | `user`, `isAuthenticated`, `isLoading`                          | API login/logout, token refresh                |
| `pings.store.ts`    | `incomingPings` (Map), `recentDahs`, `connected`                | WebSocket `ping_in`, `dahed`, `expired` events |
| `contacts.store.ts` | `contacts[]`, `isLoading`                                       | API GET/POST/DELETE /contacts                  |
| `privacy.store.ts`  | `nameVisibility`, `bioVisibility`, `blockedUsers[]`, `isLoaded` | `usePrivacy()` hook; reset on sign-out         |

- **Never cache server responses in Zustand.** Use TanStack Query for that.
- WebSocket events update Zustand directly via `store.getState()`.
- **Every Zustand store MUST expose a `reset()` method** that returns the state to its initial values. When adding a new store, also add its `reset()` call to `signOut` in `useAuth.ts`.

## WebSocket Lifecycle

1. **Connect** on successful auth → open WebSocket to dit-ping.
2. **Auth message** → send `{ type: "auth", token }` immediately on `onopen`.
3. **Heartbeat loop** → send `{ type: "heartbeat" }` every 30 seconds.
4. **Reconnect backoff** → on close/error, exponential backoff (1s → 2s → 4s → ... → 30s max).
5. **Disconnect** on logout or explicit user action.

All WebSocket logic lives in `src/services/websocket.ts`. Singleton instance `pingSocket`.

## Notification Setup Sequence

1. **Category registration** — register Notifee categories with action buttons at app startup (before any notification can arrive).
2. **Background handler** — `messaging().setBackgroundMessageHandler()` + `notifee.onBackgroundEvent()` registered at module level (outside React tree).
3. **Foreground handler** — `messaging().onMessage()` + `notifee.onForegroundEvent()` registered in the app layout component.
4. **Token registration** — get FCM token, send to norbo-api `POST /push-tokens`.
5. **Token refresh** — listen for `messaging().onTokenRefresh()`, re-register with norbo-api.

## API Interceptor Flow

1. Attach `Authorization: Bearer <accessToken>` header.
2. If response is 401 → attempt token refresh via `POST /auth/refresh`.
3. If refresh succeeds → retry original request once with new token.
4. If refresh fails → clear auth store, navigate to login.

All HTTP logic lives in `src/services/api.ts`.

## MMKV Key Conventions

| Key                 | Type        | Purpose                                            |
| ------------------- | ----------- | -------------------------------------------------- |
| `dit_refresh_token` | string      | Encrypted refresh token (persists across restarts) |
| `dit_user_prefs`    | JSON string | User preferences (theme, haptic toggle)            |

Access token is **memory-only** (Zustand `auth.store.ts`). Lost on app restart → re-auth via refresh token.

## UI layer

### Token hierarchy

background → surface → surface2 → surface3 (each layer slightly lighter in dark,
slightly darker in light). Never jump layers — e.g. an element on surface must use
surface2 for its internal elevated areas, not surface3.

### Semantic color contract

Primary = toxic green (#2EF080 dark, #00B84E light). It IS the success color.
Ping sent/dahed = primary. Do not introduce a separate "dah" green — it is primary.
Error = red. Warning = amber. Info = blue. Each semantic color has a full variant:
solid fill, soft background, border. Use the correct variant for the context.

### Pressable hierarchy

DitPressable (universal) →
scale prop controls the press depth (row < card < cta)
haptic prop controls the feedback weight (light < medium < heavy < success/warning/error)

### PingTimeline

Sole Skia component. Receives events[] prop. Renders sequence diagram:
two vertical rails, horizontal arrows per event, semantic color per status.
Animates via Reanimated shared values for zero-JS-thread updates on WebSocket messages.

### BlurView zones

- Tab bar background: intensity 50, tint adaptive
- Bottom sheet handle area: intensity 55, tint adaptive
- Modal overlay: intensity 70, tint adaptive
- Never in list items or cards (performance cost not justified)

## Mobile auth flow

### Cold start

1. Hydrate: read user from MMKV → isAuthed = true (optimistic)
2. Validate: GET /auth/me → if 401, clearAuth() and show login
3. WS token: POST /auth/ws-token → store wsToken in memory
4. Connect: open WebSocket to dit-ping with wsToken

### Login

1. User completes auth flow (password / OTP / social)
2. Session cookie set by backend automatically
3. finalizeLogin(): GET /auth/me + POST /auth/ws-token (parallel)
4. setUser() + setWsToken() → isAuthed becomes true
5. Root navigator switches to main app automatically

### WebSocket reconnect

1. Before reconnect: check wsToken expiry (< 3 min remaining → refresh)
2. POST /auth/ws-token → new wsToken
3. Connect with fresh token

### Sign out

1. POST /auth/sign-out → session cookie cleared by backend
2. clearAuth() → isAuthed = false, MMKV auth keys removed
3. Reset all Zustand stores (contacts, pings, …) via `store.getState().reset()`
4. `queryClient.clear()` → flush entire React Query cache
5. Root navigator switches to AuthScreen automatically

Language store is intentionally preserved across sessions.

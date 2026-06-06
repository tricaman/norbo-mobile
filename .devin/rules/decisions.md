---
trigger: model_decision
description: "ADR log for norbo-mobile. Read before proposing alternatives to established choices."
---

> LIVING DOCUMENT — update this file whenever you:
> introduce a new pattern, convention, or architectural decision;
> discover a library behaviour that differs from what is written here;
> add a new dependency that has rules worth capturing;
> fix a bug caused by violating a rule that is not yet documented.

# Architecture Decision Records — norbo-mobile

## ADR-001 — Bare Expo over managed workflow

**Date:** 2026-04-05
**Decision:** Use Expo bare workflow instead of managed.
**Rationale:** Notifee requires native module access for custom notification channels, action buttons, and background handlers. Managed Expo workflow does not support arbitrary native modules without config plugins, and Notifee's plugin support is limited.
**Consequence:** Manual `pod install` after adding native deps. No Expo Go support — use development builds (`npx expo run:ios` / `npx expo run:android`). Native configuration in `ios/` and `android/` directories.

## ADR-002 — Native WebSocket over socket.io

**Date:** 2026-04-05
**Decision:** Use the built-in `WebSocket` API (React Native polyfill) instead of socket.io-client.
**Rationale:** dit-ping speaks raw WebSocket with a custom JSON protocol. socket.io adds an abstraction layer (engine.io transport negotiation, room/namespace concepts) that we don't need and that would require socket.io on the Go server side.
**Consequence:** Implement heartbeat and reconnect logic manually in `src/services/websocket.ts`. No automatic reconnect, no multiplexing — all handled explicitly. Message framing is JSON with a `type` discriminator.

## ADR-003 — MMKV over AsyncStorage

**Date:** 2026-04-05
**Decision:** Use `react-native-mmkv` for all persistent storage instead of `@react-native-async-storage/async-storage`.
**Rationale:** MMKV is synchronous (no async overhead for reads), encrypted by default, and ~10x faster than AsyncStorage. Critical for storing the refresh token securely.
**Consequence:** No Expo Go support (requires bare workflow). Wrap all MMKV access in typed accessors in `src/utils/storage.ts`. Never import MMKV directly in components — always go through the storage utility.

## ADR-004 — TanStack Query for server state + Zustand for client state

**Date:** 2026-04-05
**Decision:** Use TanStack Query v5 for all server-cached data (contacts, user profile, ping history). Use Zustand for ephemeral client state (auth, real-time pings, UI flags).
**Rationale:** Clear separation of concerns. TanStack Query handles caching, background refetch, stale-while-revalidate, and error retry. Zustand handles synchronous, reactive client state. Mixing them leads to stale cache bugs and double sources of truth.
**Consequence:** Never cache API responses in Zustand. Never use TanStack Query for WebSocket-driven real-time data. WebSocket events update Zustand stores directly. TanStack Query queries can read from Zustand selectors if needed for optimistic updates.

## ADR-005 — Unistyles v3 over NativeWind

**Date:** 2026-04-05
**Decision:** react-native-unistyles for all styling.
**Rationale:** JSI/C++ runtime, type-safe theme tokens, zero class utilities, better New Architecture compatibility.
**Consequence:** StyleSheet.create() banned everywhere. All styles via createStyleSheet().

## ADR-006 — Toxic green as primary, two values for dark/light

**Date:** 2026-04-05
**Decision:** primary is #2EF080 (dark mode) and #00B84E (light mode).
**Rationale:** #2EF080 on dark has a luminance ratio that makes it electric and readable. On white backgrounds (#2EF080 fails WCAG AA for text), so #00B84E (darker, same hue family) is used for light mode text/icon usage. The fill color (#2EF080) can be used in both modes as a button background since text on top uses textOnPrimary (#060F08 dark, #FFFFFF light).
**Consequence:** never use a single hardcoded green hex. Always theme.colors.primary.

## ADR-007 — Success = primary (no separate green)

**Date:** 2026-04-05
**Decision:** theme.colors.success and theme.colors.primary are the same value.
**Rationale:** in Dit, the primary action IS confirmation (ping, dah). Having a separate success color would split the visual identity.
**Consequence:** success toasts/badges use the same green as primary buttons.

## ADR-008 — withSpring always, withTiming almost never

**Date:** 2026-04-05
**Decision:** spring animations for all user-triggered UI motion.
**Rationale:** springs respond to interruption (feel alive), timing functions play to completion regardless of user input (feel mechanical).
**Consequence:** withTiming() restricted to: progress bars, loading states, numeric readouts.

## ADR-009 — DitPressable as universal pressable primitive

**Date:** 2026-04-05
**Decision:** single pressable component with haptic + scale + spring built in.
**Rationale:** consistent feedback is a product-level constraint, not a per-developer choice.
**Consequence:** TouchableOpacity and Pressable (RN core) are banned.

## ADR-010 — Skia for PingTimeline only

**Date:** 2026-04-05
**Decision:** @shopify/react-native-skia used exclusively for the ping timeline.
**Rationale:** timeline requires imperative drawing with real-time WebSocket updates on the UI thread. Skia handles this natively; Reanimated+View cannot match the performance.
**Consequence:** all other UI uses Unistyles + Reanimated, never Skia.

## ADR-011 — Single AuthScreen with internal view state, no stack navigator

**Date:** 2026-04-06
**Decision:** auth flow implemented as one screen with useState-driven view switching.
**Rationale:** avoids navigation chrome (header, back gesture) on auth screens, enables smooth opacity crossfade between views, keeps auth self-contained.
**Consequence:** no navigation.navigate() inside auth — use onNavigate prop instead.

## ADR-012 — withCredentials: true on axios for session cookie

**Date:** 2026-04-06
**Decision:** axios instance always sends credentials.
**Rationale:** BetterAuth relies on httpOnly session cookie. Without withCredentials the cookie is never sent and every request returns 401.
**Consequence:** BETTER_AUTH_URL and TRUSTED_ORIGINS in norbo-api .env must include the mobile app's origin. For Expo Go in dev, add exp://localhost:8081.

## ADR-013 — WS JWT in memory only, never MMKV

**Date:** 2026-04-06
**Decision:** wsToken stored in Zustand only, cleared on app restart.
**Rationale:** WS JWT is short-lived (15 min). On cold start, app validates the session cookie via GET /auth/me then fetches a fresh wsToken. Persisting it adds complexity with no benefit given the short TTL.
**Consequence:** every cold start requires two network calls before WebSocket connects. This is acceptable — both calls are fast and run in parallel.

## ADR-015 — Block removes local data optimistically before server confirms

**Date:** 2026-04-25
**Decision:** When the user confirms a block via the Alert dialog, local store cleanup (`removeContactByUserId`, `deleteConversation`) happens inside the same `onPress` handler that calls the API. Cleanup is not deferred to `onSuccess`.
**Rationale:** The user has already confirmed a destructive action. Keeping stale data visible while the API call is in flight creates a jarring moment where a "blocked" contact or conversation is still visible. The risk of the API failing is minimal, and if it does the user can retry. Stale visible data is worse than an unrecoverable action.
**Consequence:** If the API call fails, the local state is already cleaned. The user must re-navigate to the contact or conversation to see it again. Acceptable trade-off for the common (success) case.

## ADR-016 — Neutral error messages for blocked interactions

**Date:** 2026-04-25
**Decision:** When the backend returns 404 for a blocked interaction (ping history, send ping, profile view), the mobile shows neutral text: "this conversation is no longer available" or "user not found" — never any mention of blocking or rejection.
**Rationale:** Mirrors the backend's deliberate `404` response (see norbo-api ADR-012). Revealing that a block exists would defeat the privacy model. Neutral messages are equally applicable to deleted accounts or expired data, so they are honest without leaking intent.
**Consequence:** Users cannot distinguish "blocked" from "account deleted" or "data expired". This is by design. Client UX must not attempt to distinguish these cases — never add conditional logic that checks for a block-specific error code.

## ADR-014 — DM Mono as secondary identity font

**Date:** 2026-04-14
**Decision:** DM Mono (Regular 400 + Medium 500) as secondary font alongside System UI.
**Rationale:** DM Mono is geometric monospace — visually coherent with the morse code / TLC identity of Dit. Numbers and codes (timestamps, TTLs, usernames) read as signals, not prose. Two-font system keeps identity sharp without adding weight.
**Consequence:** every new text element must be explicitly categorised as signal (DM Mono) or human language (System UI). Rule: if it is a number, code, handle, or identity label → DM Mono. If it is a name, sentence, or description → System UI. Fonts loaded via `expo-font` + `@expo-google-fonts/dm-mono` in `app/_layout.tsx`. App returns `null` until fonts are ready, keeping the native splash visible — no font flicker.

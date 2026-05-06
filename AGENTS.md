> LIVING DOCUMENT — update this file whenever you:
> introduce a new pattern, convention, or architectural decision;
> discover a library behaviour that differs from what is written here;
> add a new dependency that has rules worth capturing;
> fix a bug caused by violating a rule that is not yet documented.

# Dit Mobile

Bare Expo workflow, React Native 0.83+ New Architecture enabled. iOS + Android only, no web.

- Never AsyncStorage. Always react-native-mmkv (access token in memory, refresh in MMKV encrypted).
- Zustand for client state. TanStack Query v5 for server state. Never mix them.
- Native WebSocket API only. No socket.io-client.
- All HTTP via `api.service.ts` (axios). Never import axios elsewhere.
- Notifee handles all notifications. `PING_ACTIONS` category registered at app startup before any notification arrives.
- date-fns only for dates. No moment.js, no dayjs, no raw Date manipulation.
- English only: code, comments, logs, commit messages.

## DESIGN SYSTEM

Styling: react-native-unistyles v3. NEVER RN's StyleSheet.create().
Every style via `StyleSheet.create(theme => ...)` from `react-native-unistyles`.
For theme access in component logic: `const { theme } = useUnistyles()`.
Tokens in src/theme/.
Primary color: toxic green. Dark: #2EF080. Light: #00B84E.
Text on primary fill: theme.colors.textOnPrimary (never hardcode).
Semantic colors: success (=primary), error, warning, info.
Always use theme.colors._ — never hardcode hex in components.
Animations: react-native-reanimated v3. Always withSpring().
Spring presets in src/hooks/useSpring.ts. Never inline damping/stiffness.
Gestures: GestureDetector + Gesture._ only. Old handler components banned.
Pressables: DitPressable only. Never TouchableOpacity, Pressable (RN core).
Haptics: src/utils/haptics.ts only. Match haptic weight to semantic color:
green action → medium/success, red → error, amber → warning, gray → light.
Timeline: @shopify/react-native-skia for PingTimeline only.
Depth: expo-blur for sheets/modals/headers. Intensity 40–80 range only.

## UI PRIMITIVES (centralized, in src/components/ui/)

NEVER reimplement these patterns inline. Use the primitive:

- `Screen` — every screen's top-level wrapper. Replaces the repeated `{ flex: 1, backgroundColor: theme.colors.background }` SafeAreaView.
- `ScreenHeader` — sub-screen / modal header (back button + centered title + optional `right` slot).
- `TabHeader` — big title for tab roots (title1, letterSpacing 2).
- `TabScreen` — canonical wrapper for every tab-root screen (`dits`, `contacts`, `settings`, `profile`). Combines `Screen` + `TabHeader`. Never use `Screen` + separate `TabHeader` in tab roots.
- `SaveHeaderAction` — checkmark header button; used as `right` of ScreenHeader on forms.
- `FormCard` — surface card with optional uppercase label + internal dividers; use `dividedChildren` for multi-field cards.
- `SettingsCard` + `SettingsRow` — canonical grouped icon-value-label rows. Also for "profile info" layouts.
- `SectionLabel` — uppercase primary footnote above grouped cards.
- `Description` — footnote secondary helper text under forms.
- `Divider` — hairline rule (`inset` prop available).
- `ListSeparator` — FlatList separator for avatar-indented rows.
- `Avatar` — circular themed avatar (`size: sm | md | lg | xl`).
- `QueryBoundary` — wraps a `UseQueryResult` and handles pending/error/empty/success states declaratively. Children is a render function `(data) => ReactNode`. Override `LoadingComponent`, `ErrorComponent`, `EmptyComponent` or `isEmpty` as needed. Only for TanStack Query (`useQuery`) — not for Zustand-backed data.
- `AvatarRow` — shared layout primitive for avatar + two-row content (title left, `titleRight?` slot, `subtitle?` ReactNode, `subtitleRight?` slot, optional `hint?` third line). Used by `ContactRow` and `ConversationRow`. `title` is always styled (subhead + textPrimary + lowercase); subtitle/hint are ReactNode so callers own their text style. `style?` overrides row padding/margin.

Layout tokens: `theme.hairline` (0.5), `theme.avatarSize.{sm,md,lg,xl}`. Always prefer these over literals.

A screen's local `StyleSheet.create` should hold only genuinely screen-specific layout. If a style appears in two files, promote it to a primitive or extend an existing one.

## FONTS

Two fonts only: DM Mono (identity/codes/signals) + System UI (body/names).
DM Mono loaded via expo-font in `app/_layout.tsx` (`DMMono-Regular`, `DMMono-Medium`).
Access via `theme.monoTypography.*` or `theme.fonts.mono` / `theme.fonts.monoMd`.
Apply DM Mono to: timestamps, usernames (@handle), button labels (dit/dah),
TTL countdowns, OTP inputs, wordmark, tagline, unread counts, ping preview text
in conversation list, rail labels in timeline.
NEVER apply DM Mono to: display names, body paragraphs, navigation titles,
form field labels, error messages.
Skia text: use `matchFont({ fontFamily: 'DMMono-Regular', ... })` after fonts are
loaded. Include fallback: `matchFont(...) ?? matchFont({ fontSize: n })`.
Font loading gates the entire app — `RootLayout` returns `null` until fonts
are ready, keeping the native splash visible. No font flicker on startup.

## SPLASH

Native splash only — there is no JS-side splash component.
`expo-splash-screen` plugin in `app.config.ts` shows the original full
brand logo (`assets/images/splash-icon.png`, `imageWidth: 200`) on a
theme-aware background (`#EAEAEE` light / `#000000` dark via the
plugin's `dark` block).
Disc-only assets `assets/images/splash-disc-{light,dark}.png` and the
`scripts/generate-splash-icons.js` generator are kept around as a
parking lot for a future iteration aiming at perfect splash → LandingView
continuity (currently shelved — UX preferred the original logo).
On `LandingView`, `DitDot` plays its full entry animation (bouncy disc,
then staggered arcs).
Native splash changes require `npx expo prebuild --clean` + native rebuild;
hot reload does NOT pick them up.

## NAVIGATION

Expo Router (file-based). All screens live in `src/app/`. Routes are domain-grouped — never add screens at the root level.

Route map:

- `(auth)/` — unauthenticated screens (login, OTP, etc.)
- `(tabs)/` — tab navigator: `dits`, `contacts`, `profile`, `settings`
- `dit/[userId]` — dit detail screen (main feature)
- `contacts/[userId]/index` — view another user's profile
- `contacts/[userId]/add` — add-contact form
- `settings/account/index` — account info hub (username / name / bio links)
- `settings/account/username` — edit username
- `settings/account/name` — edit display name
- `settings/account/bio` — edit bio
- `settings/account/delete-account` — confirm-username → permanent account deletion
- `settings/language` — language picker

Navigation rules:

- Never add a standalone screen at the `src/app/` root — always nest under its domain group.
- Every `<Stack.Screen>` entry in `_layout.tsx` must use the full path (e.g. `settings/account/username`, NOT `username`).
- New sub-screens under an existing module go into the correct subdirectory; no `_layout.tsx` needed unless a nested Stack is required.
- Use `router.push("/settings/account")` pattern — typed paths only, no string literals to dead routes.

## CONTACTS

All contact operations via `useContacts()` hook. Never call `contactsApi` directly in screens (exception: search in contacts screen which calls it for debounced UX — but mutations go through the hook).
`displayName` from server is the source of truth — never recompute it on the client.
Search is debounced 400ms client-side. Minimum query length: 2 chars.
`ContactRow` uses long press for delete (Alert confirmation). No swipe — kept simple.
`SCREEN_BOTTOM_PADDING` from `src/constants/layout.ts` on every FlatList `contentContainerStyle`.
Contact store: `src/stores/contacts.store.ts`. API layer: `src/services/contacts.api.ts`.
Types: `src/types/contacts.types.ts` (`PublicUser`, `OwnProfile`, `ContactWithUser`, etc.).

## FORMS

Forms use `react-hook-form` + `zod` validation via `@hookform/resolvers`.
Never manage form state manually with `useState` (no manual error/loading/value state for forms).
Use `useForm` from `src/hooks/useForm.ts` — it pre-wires `zodResolver` automatically.
Use `FormInput` from `src/components/ui/FormInput.tsx` for standard text inputs inside forms.
`FormInput` requires `FormProvider` wrapping in the parent screen (`import { FormProvider } from 'react-hook-form'`).
API errors that map to a field use `form.setError('fieldName', { message: '...' })` — never a separate error state.
Form submission: `form.handleSubmit(mutate)`. Never call mutate directly without handleSubmit.

## SERVER STATE

Mutations use `useMutation` from `src/hooks/useMutation.ts` — never raw `useReactQueryMutation` or manual try/catch in components.
`useMutation` key options (all optional):

- `triggerHaptics` (default `true`) — haptics on success/error.
- `showErrorToast` (default `true`) — shows a custom toast (type `error`) with the server `message` and `errorCode`. Set `false` when surfacing the error inline via `form.setError()`.
- `showSuccessToast` (default `false`) — shows a custom toast (type `success`). Opt in when there is no obvious UI confirmation.
- `successMessage` / `errorMessage` — string or `(data/error) => string`.
  Default `TError` is `ApiError` = `AxiosError<ApiErrorResponse>`. Server error shape: `{ statusCode, errorCode, message, errorId, timestamp }`.
  Toasts: custom `toast` from `src/utils/toast.ts` only. Never `burnt`, never `Alert.alert` for transient feedback.
  Queries use `@tanstack/react-query` directly (`useQuery`). `QueryClientProvider` is mounted at the root in `src/app/_layout.tsx`.
  Never mix Zustand and TanStack Query for the same data. Zustand = client/UI state, TanStack Query = server state.

## TOAST

Custom toast system — `burnt` is gone.

- API: `import { toast } from "@/utils/toast"; toast.show({ type, title, subtitle?, duration? })` / `toast.hide()`.
- Types: `'success' | 'warning' | 'error'`.
- `ToastProvider` wraps the app root (inside `GestureHandlerRootView`) in `src/app/_layout.tsx`.
- Never call `burnt`, never `Alert.alert` for transient feedback. Reserve `Alert.alert` for destructive confirmations only.

## PINGS

**Dah/ignore flow**: Send via WebSocket if `wsService.isConnected()`, otherwise REST fallback (`pingsApi.dahPing` / `pingsApi.ignorePing`). Never use optimistic timeout without server confirmation.

**`dahed` event**: dit-ping sends the `dahed` WS event to **both** the ping sender AND the dah sender (ping recipient). The dah sender's client uses this as confirmation to resolve the promise. Never assume `dahed` only arrives on the sender's device.

**WebSocket URL**: `ws://localhost:8080/ws` (plain WS, NOT `wss://`). dit-ping has no TLS. Port is 8080. Set in `.env` as `EXPO_PUBLIC_WS_URL`. Wrong scheme or port will silently fail to connect — Go server will show no activity.

Optimistic updates in store on send. Dah updates store only after server confirmation (WS `dahed` event or REST response). Rollback on failure.
PingTimeline rendered with Skia. Never replace with View/Text components.
TTL countdown via `useTtlCountdown` hook. Never compute inline in render.
Preview text computed from direction+status+isAlive — single source of
truth in `src/utils/ping.utils.ts`. Never duplicated in components.
`unreadCount` from server — do not compute locally.
Action bar is contextual: shows dah/ignore OR send+TTL OR countdown.
Never show multiple action states simultaneously.
WebSocket service: `src/services/websocket.service.ts` (typed event emitter singleton).
Old `src/services/websocket.ts` is deprecated — use `websocket.service.ts`.
Ping store: `src/stores/pings.store.ts`. API layer: `src/services/pings.api.ts`.
Types: `src/types/pings.types.ts`.
Hooks: `usePings`, `usePingHistory`, `useSendPing`, `useDahPing`, `useIgnorePing` in `src/hooks/usePings.ts`.
`useWebSocket` wired at root `_layout.tsx` after splash.
Dit Detail screen: `src/app/dit/[userId].tsx`.

## PRIVACY

### Block action

- Block action **always** shows an `Alert.alert` confirmation with destructive style before calling the API.
- After a confirmed block: immediately clean local stores (`removeContactByUserId`, `deleteConversation`) **before** navigating back, regardless of the API result (optimistic cleanup).
- After confirmed block and API success: `haptics.error()` and `router.back()`.
- Never reveal block existence: 404 responses are surfaced as neutral "not available" messages — never "blocked".

### Hooks + stores

- `usePrivacy()` is the **single entry point** for all privacy operations. Screens never call `privacyApi` directly.
- Privacy store: `src/stores/privacy.store.ts`. API layer: `src/services/privacy.api.ts`. Types: `src/types/privacy.types.ts`.
- On sign-out and account deletion: `usePrivacyStore.getState().reset()` must be called alongside the other store resets.
- `contacts.store.ts` exposes `removeContactByUserId(userId)` — removes by `user.id`, not contact record `id`.

### Blocked state UI

- If `usePingHistory` returns 404, `unavailable` becomes `true`. The dit detail screen detects this and calls `router.back()`.
- If sending a dit returns 404: show inline error `t("privacy.userNotFound")` — never "blocked".
- Contact rows where name/bio is `null` fall through to `username` via `nickname ?? name ?? username` — no special handling needed.

## AUTH

BetterAuth session cookie: handled automatically by axios (withCredentials: true).
Never manually manage the session cookie.
WS JWT: in-memory only (Zustand auth store). Never persisted to MMKV.
Fetched via POST /auth/ws-token after every login and before WS reconnect.
**On app reload**: `isAuthed=true` is restored from MMKV but `wsToken=null` (not persisted by design). `useWebSocket` automatically fetches a fresh wsToken via `authApi.getWsToken()` when `isAuthed && !wsToken`. Do not add wsToken to MMKV — always fetch fresh.
All auth logic via useAuth() hook. Never call authApi directly in components.
Social login via expo-auth-session + WebBrowser.openAuthSessionAsync().
Never implement OAuth redirect handling manually.
Auth screens: single AuthScreen component with internal view state (no stack nav).
Transitions via withSpring opacity animation.
User data: persisted in MMKV for display only. Not used for auth decisions.
Auth decisions based on session cookie validity (GET /auth/me → 401 = logged out).

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
- `src/shared/` mirrors framework-free contracts from norbo-api. Files with a "DO NOT EDIT" banner (e.g. `services-contract/`) are generated — edit the source in norbo-api and run `pnpm sync:contracts` there. The Services Tool System reads its `{ id, inputSchema, schemaVersion }` from `src/shared/services-contract`; the component + `persistsResult` flag are the frontend's own (see TOOLS).

## TOOLS (Services Tool System)

Three sources of truth, one key — the tool `id` string:

- **Shared contract** `src/shared/services-contract` (generated): input zod schema + `schemaVersion`. Import validation from here — NEVER redefine a tool's schema in the app.
- **Frontend registry** `src/components/tools/registry.ts`: `id → { component (lazy), persistsResult }`. This is the local source of truth for "which tools this build can render". `Partial<Record<ServiceToolId, …>>` on purpose — a build need not ship every tool.
- **Backend metadata**: DB-backed `Tool` catalog (seeded) — categories / `crossSpecies` / `isPremium` / `locked` / `badge` / icon / `coverImageUrl` / **already-localized `title`+`description`** (resolved server-side from Accept-Language), served by `GET /tools` (filtered to the user's pet categories). The app shows server strings directly — no client i18n key lookup for tool title/description (in-tool field labels stay client i18n).

`useAvailableTools()` (`src/hooks/useTools.ts`) fetches the server list and intersects it with the registry via the pure `intersectAvailableTools()` (`src/utils/toolAvailability.ts`) — a tool renders only when present on BOTH sides (skew-safe + server kill-switch). The intersection/filter logic lives ONLY in that util + the backend; never inline it in screens. Adding a tool = touch the three sources of truth, nothing else. Components are placeholders until step 5; results are never persisted — only inputs are. `isPremium` is a soft client gate for now (paywall = step 7).

### Loader

`src/app/tool/[toolId].tsx` (`ToolScreen`) is the generic loader — **data-driven on the id, closed to modification**: adding a tool never touches it. It resolves the component from `TOOL_REGISTRY`, applies `PremiumGate`, lazy-mounts under a `<Suspense>` `ToolLoading` skeleton, and fires telemetry. There is NO per-tool switch/if anywhere. Note (RN + Metro): dynamic `import()` with an interpolated path is unsupported, so the explicit id→component map is a necessity; `lazy()` here defers module evaluation (snappier tab), it does NOT create separate downloadable bundles like on web.

All cross-cutting concerns live in the loader; tools stay pure and receive only typed PROPS — `ToolComponentProps<TInputs>` (`src/components/tools/tool-component.ts`): `{ pet, initialInputs, onInputsChange }`. `onInputsChange` communicates INPUTS only, never a computed result. A tool annotates its default export with `ToolComponent<Id>` to get inputs strongly typed from the shared contract (`ServiceToolInput<Id>`) — no untyped Json, mismatches caught at compile time. Register a real tool with `defineLazyTool(() => import("./MyTool"), persistsResult)` (ties the lazy module to its id at compile time, then erases for storage; `ToolComponentProps` is invariant in its input type, so the single cast inside `defineLazyTool` is unavoidable and safe — the loader always feeds that id's runtime inputs).

### Reusable UI blocks

Compose tools from `src/components/tools/ui/` — never ad-hoc styling: `ToolNumberField` (labelled numeric input + unit suffix), `ToolResultCard` (result presentation, DM Mono value), `ToolSection` (labelled separator for longer forms — wraps `Divider` + `SectionLabel`), `ToolUnitToggle` (segmented picker — units like kg/lb/cm/in, but also any small enum choice e.g. activity/sterilized). All built on the design system tokens.

### Reference tools (the three patterns)

Real tools live in `src/components/tools/impl/`, each a default-export `ToolComponent<Id>` composed only from the UI blocks; copy the closest one when adding a tool:

- `DogCalorieTool` — **numeric calc** (RER/MER formula in-component; persists inputs; vet disclaimer).
- `AquariumVolumeTool` — **geometric calc** (gross/effective volume + indicative stocking, L/gal toggle; persists inputs).
- `ReptileGuideTool` — **structured content, no calc, no persistence**: fetches curated profiles from `careKnowledgeApi.reptileEnvironment()` (`/care-knowledge/...`), pre-selects by the pet's species, renders target temp/humidity ranges.
- `PetPlacesTool` / `DogFriendlyPlacesTool` — **full-screen map** (a fourth pattern), both 15-line wrappers over the shared `places/PlacesMapView.tsx`, which takes `allowedKinds` from `kind-meta.ts` — the FoodPlantToxicityView precedent. The kind sets compose: `PET_SERVICE_KINDS` (vets/shops/grooming/shelters/boarding — species-neutral, hence `pet-places` is `crossSpecies` and shown to EVERY owner) and `DOG_KINDS = DOG_ONLY_KINDS + PET_SERVICE_KINDS` (the dog superset, so a dog owner needs one map only). Adding a species variant = a new kind list + a 15-line wrapper; never a new engine. Never deref `KIND_META[kind]` directly: use `getKindMeta()` (a newer server can serve unknown kinds → crash). Engine details: `react-native-maps` `PROVIDER_DEFAULT` (Apple Maps iOS / Google Maps Android — Android key via `ANDROID_MAPS_API_KEY`, see `app.config.ts`), viewport-driven `usePlacesNearby` (bbox snapped to 2 decimals, 500 ms debounce, `keepPreviousData`, mirrors the server's 3° span cap), hand-rendered `supercluster` clustering (`tracksViewChanges={false}` on every marker is mandatory for FPS), inline `PlaceDetailSheet` Modal (no `router.push` — the tool stays pure), location permission requested ONLY from the "near me" FAB after an in-app rationale (never on mount; denied ⇒ map still fully works from the Italy fallback region). Persists the layer selection only — the contract schema deliberately has no coordinates. Supporting pieces in `src/components/tools/places/` (`kind-meta.ts` is the single source for per-kind icon/label). ODbL attribution must stay visible on the map. **Address search**: `useAddressSearch` always queries our own `/places/search` first (free) and only calls a geocoder when the server replies `confident: false`. `geocode.ts` is the ONLY file that branches on `Platform.OS`, and that split is a legal boundary, not a preference — Google's terms forbid showing Geocoding results next to a non-Google map, so iOS uses Apple's `CLGeocoder` (via expo-location, free, no permission needed) and Android uses our proxy. **Never add an iOS fallback to the proxy.** The top overlays (search bar, filter chips, results) live in ONE absolutely-positioned column with `pointerEvents="box-none"` — without it the container eats map pans in its empty gaps.

Tools never import persistence/premium/telemetry — they only read `initialInputs`/`pet` and call `onInputsChange`. They debounce input changes with `useDebounce` before notifying (the loader persists). Adding a tool = the three sources of truth only (contract + this registry + backend catalog) + its i18n keys; never the loader/persistence/UI blocks.

- **Badge (highlight, NOT a gate)**: `ToolBadgeChip` renders the server `badge` (`PREMIUM_FREE` | `NEW` | `BETA`) in `ToolRow`, next to the title — data-driven, no per-tool code. Deliberately NOT in the tool loader's header (its title is centered `flex: 1` on one line: a right-slot chip truncates longer names). `tool-badge-meta.ts` (`BADGE_META`) is the single source for icon/label-key/tone, labels live in `servicesHub.badge.*` (client i18n, closed set). Resolve ONLY via `getToolBadgeMeta()` — an unknown value from a newer server must render nothing, never crash. `PREMIUM_FREE` marks a premium-grade tool that is free for everyone (the places maps): it says nothing about access, which is `locked`'s job below.
- **Premium**: `PremiumGate` (`src/components/tools/PremiumGate.tsx`) renders `PremiumPaywall` when the tool is `locked`, else passes through. `locked` is **server-authoritative** — the loader reads it from the tools list (`GET /tools` computes `isPremium && !entitled`); the client never decides entitlement itself. This is the ONLY gating seam — tools never change. All tools are currently free (`isPremium: false` server-side) so nothing locks; the gate stays wired for the future. Client gate ≠ security: a truly-protected tool would ALSO be enforced server-side (set `isPremium: true` + guard its sensitive endpoint with `PremiumGuard`). Store payment/receipt integration is out of scope — the paywall CTA is a stub.
- **Persistence (offline-first)**: `useToolInputs(toolId, petId, enabled)` (`src/hooks/useToolInputs.ts`) reads the MMKV cache (`src/services/tool-inputs.cache.ts`, `createMMKV({ id: "norbo-tool-inputs" })`) synchronously as `initialData`, then React Query syncs with `GET/PUT /tools/:toolId/result`. Both cache read and query discard inputs whose `schemaVersion` is incompatible with the contract. `enabled` = the tool's `persistsResult`.
- **Telemetry**: `analytics` (`src/services/analytics.ts`) — `tool_opened` on mount, `tool_completed` on a successful save, both fired by the loader (zero per-tool code). ⚠️ No analytics SDK is wired yet; `track` is a dev-log/no-op seam (like PremiumGate). Replace its body when a provider is adopted.

## DESIGN SYSTEM

Styling: react-native-unistyles v3. NEVER RN's StyleSheet.create().
Every style via `StyleSheet.create(theme => ...)` from `react-native-unistyles`.
For theme access in component logic: `const { theme } = useUnistyles()`.
MANDATORY: the unistyles Babel plugin MUST be in `babel.config.js`
(`['react-native-unistyles/plugin', { root: 'src' }]`, before reanimated and
before react-compiler). It is what installs the native binding that propagates
runtime theme changes. WITHOUT it, `StyleSheet.create` styles are static and
the theme only "updates" on app restart (MMKV bootstrap) — never at runtime.
Do NOT work around this with manual `useThemeStore`/`useUnistyles()`
subscriptions in components; fix the plugin. Babel changes need `--clear`
(Metro cache); no native rebuild needed since the native module already ships.
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
- `DateField` — themed wrapper around `@react-native-community/datetimepicker`. Exposes a `Date | null` value + `onChange(Date)` API; uses iOS `display="compact"` (small chip with popover) and the imperative `DateTimePickerAndroid.open()` on Android behind a themed pressable. Never use the raw `DateTimePicker` component in screens — always go through `DateField`. Callers convert to/from ISO strings themselves (see `BirthDateStep`).

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

## PETS

`PetCategory` and `Sex` enums are mirrored from norbo-api in
`src/types/pet.types.ts`. The pet creation flow is a **wizard** —
not a single scrolling form — and has its own dedicated layer of
primitives under `src/components/pets/`.

Wizard architecture (`src/components/pets/wizard/`):

- `wizard.types.ts` — `petWizardSchema` (zod), `PetWizardValues`
  type, ordered `FORM_STEPS` and `TOTAL_FORM_STEPS` constant. Single
  source of truth for the data accumulated through the flow.
- `category-meta.ts` — per-`PetCategory` icon glyph (MaterialCommunity
  Icons), warm tint hex, i18n tagline key, and curated quick-pick
  `NAME_SUGGESTIONS`. Anything category-specific in the UI must read
  from here — no per-category branches scattered across components.
- `PetCategoryIcon.tsx` — single source of truth for the glyph that
  represents a category. Backed by MaterialCommunityIcons (Ionicons
  lacks animal glyphs).
- `PetWizardLayout.tsx` — Screen + KeyboardAvoidingView + animated
  content area + sticky footer. Every wizard step uses this; never
  reimplement the chrome.
- `PetWizardHeader.tsx` — leading button (close / back / none) +
  progress dots (`TOTAL_FORM_STEPS`) + optional skip text.
- `PetWizardButton.tsx` — primary pill CTA (`variant="primary"`) and
  secondary text link (`variant="ghost"`). Supports `loading` and
  `trailingChevron`.
- `PetWizardHero.tsx` — colored hero card at the top of every form
  step (large translucent category icon + counter pill).
- `PetWizardChoiceRow.tsx` — segmented selector for binary / ternary
  fields (sex, sterilized).
- `PetCategoryCard.tsx` — selectable card on the category step.
- `PetSuggestionChips.tsx` — quick-pick name chips.
- `PetStepHeading.tsx` — the big question + subtitle pair.

Each step lives in `src/components/pets/wizard/steps/` and is a pure
presentational component: it owns no global state, receives the
slice it needs plus `onNext`, `onBack`, `onSkip` callbacks. The
orchestrator `src/app/pets/new.tsx` holds the wizard state machine
(`step + Partial<PetWizardValues> + createdPet`) and routes between
steps.

Step order: `category → name → species → sex → birthDate →
sterilized → confirm`. Only the five middle steps render progress
dots. `name` is the only required field — every other step exposes
a "Salta" button. The API submission happens at the end of the
`sterilized` step (its primary CTA double-duty); the response then
transitions to the celebratory `confirm` step.

Pets list empty state uses `PetsEmptyHero` (3 stacked category
squircles + copy + pill CTA), not the generic `EmptyState`. Empty
state is rendered via `FlatList.ListEmptyComponent` (combined with
`isEmpty={() => false}` on `QueryBoundary`) so pull-to-refresh
keeps working when the list is empty.

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

**`dahed` event**: norbo-ping sends the `dahed` WS event to **both** the ping sender AND the dah sender (ping recipient). The dah sender's client uses this as confirmation to resolve the promise. Never assume `dahed` only arrives on the sender's device.

**WebSocket URL**: `ws://localhost:8080/ws` (plain WS, NOT `wss://`). norbo-ping has no TLS. Port is 8080. Set in `.env` as `EXPO_PUBLIC_WS_URL`. Wrong scheme or port will silently fail to connect — Go server will show no activity.

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

## NEWS / ANNOUNCEMENTS

Global (not per-pet) news feed. Entry point is a `SettingsRow` in the Profile
tab (`iconName="megaphone"`) that shows an unread pill; it routes to
`/news` (list) → `/news/[id]` (detail). Reference slice = Expenses.

- **Slice**: `src/services/news.api.ts` (`newsApi.list/get`) → `src/hooks/useNews.ts`
  (`useNewsList`, `useNewsItem`, `useNewsUnread`) → `src/app/news/index.tsx` (list) +
  `src/app/news/[id]/index.tsx` (detail) → `src/components/news/{NewsRow.tsx,
  news-format.ts}`. Types in `src/types/news.types.ts` (re-export `NewsCategory`
  from `@/shared/news-contract` — generated, DO NOT edit; UI/format code imports
  the enum from `@/types/news.types`, never from `@/shared` directly).
- **Read/unread is client-side** — `src/stores/news-read.store.ts`
  (`createMMKV({ id: "norbo-news-read" })`, JSON id array). `useNewsItem` marks
  an item read on open (via `useEffect`), so opening it clears the unread pill.
  On sign-out AND account deletion, `useNewsReadStore.getState().reset()` runs
  alongside the other store resets in `useAuth`.
- **Category** (`PRODUCT | CARE_TIP | MAINTENANCE | GENERAL`) is cosmetic
  (badge/icon) — colors/icons in `news-format.ts`, labels via i18n
  `news.categories.*`. Added under a `news` block in all 16 locale files.

### Push deep-link (`src/services/notifications.ts`) — the gotcha

FCM is data-only; Notifee renders on-device. Routing goes through the single
helper **`getNavTargetFromData(data)`** — the ONLY place that maps discriminators
to a route (`reminderId → /reminder/:id`; `type === "news"` + `newsId →
/news/:id`). It is wired into ALL press paths, which previously each read
`reminderId` independently: foreground `onForegroundEvent` PRESS, background
`onBackgroundEvent` PRESS (which used to only cancel — it now navigates too), and
cold-start `handleInitialNotification`. When adding a new deep-linkable
notification type, extend `getNavTargetFromData` — do NOT re-read `data` in the
handlers. Title/body come from `data.title ?? data.notifee_title` (the worker
injects `notifee_*` for data-only payloads); news reuses the `default` Android
channel (no dedicated channel / iOS action category — it is read-only).

## IN-APP UPDATE

Android updates itself WITHOUT leaving the app (Google Play Core via
`sp-react-native-in-app-updates`); iOS can't — Apple exposes no in-app update
API — so there the CTA opens the App Store page.

- **Slice**: `src/services/app-version.api.ts` (`GET /app/version`) +
  `src/services/in-app-updates.ts` (Play Core wrapper) → `src/hooks/useAppVersion.ts`
  → `src/components/app/UpdateGate.tsx` (mounted once in `app/_layout.tsx`) +
  `src/components/app/UpdateHeaderButton.tsx`. Ephemeral state in
  `src/stores/app-update.store.ts`; copy under `appUpdate.*` in all 16 locales.
- **Two sources, two jobs.** The backend owns WHETHER a newer version exists
  (`latest`, read live from App Store + Play by norbo-api) and whether this one
  is too old (`minSupported`, env-only). Play Core owns HOW to install it, and
  only on Android: `checkPlayUpdate` answers "can THIS device update in-app
  right now?" — false for sideloaded APKs (our `internal`/`preview` builds) and
  during a staged rollout that hasn't reached the device. Detection ORs the two;
  the blocking gate additionally requires something installable, because a
  forced screen whose button leads nowhere is a dead end.
- **No popup.** `UpdateGate` publishes `available` to the store; the header icon
  (`UpdateHeaderButton`, silent otherwise) is mounted in `TabHeader` and in
  `HomeGreeting` (the home tab renders its own header) and opens a compact card.
  Optional updates use Play FLEXIBLE — background download, our own progress
  bar, then "restart now" → `completeFlexibleUpdate()`. Forced ones use Play
  IMMEDIATE, which draws its own full-screen UI and restarts by itself.
- **`startUpdate` resolves when Play's consent dialog is LAUNCHED**, not when the
  user answers. A cancel is reported ONLY through `addIntentSelectionListener`
  (as a *string* status, hence the `Number(result)` coercion) — without it the
  card would stay stuck at 0% in a phase where it can't be closed.
- Everything is FAIL-OPEN: a missing native module or an unreachable store
  degrades to "no update", and a Play flow that refuses to start falls back to
  the store page. The app is never blocked by a check that couldn't run.
- **Needs a native rebuild**: the library is autolinked (it also pulls
  `react-native-device-info` + `react-native-siren` as transitive native deps),
  so builds made before it was added will never show the in-app flow — they
  update through the store page like today. Play Core only works for an app
  actually installed from Play: to test the real flow, use an internal-testing
  track build, not a sideloaded APK.
- **Local testing**: `EXPO_PUBLIC_APP_UPDATE_DEV_LEVEL=available|required` in
  `.env` forces the level and simulates the download (no store involved).

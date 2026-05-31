---
trigger: glob
globs: "src/**/*.ts,src/**/*.tsx"
---

> LIVING DOCUMENT — update this file whenever you:
> introduce a new pattern, convention, or architectural decision;
> discover a library behaviour that differs from what is written here;
> add a new dependency that has rules worth capturing;
> fix a bug caused by violating a rule that is not yet documented.

# Coding Standards — norbo-mobile (React Native + TypeScript)

## Project Structure

- Feature/domain organisation over technical layers.
  Prefer: `src/screens/PingHistoryScreen/` containing `index.tsx` + `styles.ts` + `hooks.ts`.
  Over: `src/hooks/usePingHistory.ts` + `src/screens/PingHistoryScreen.tsx` (scattered).
- Reusable UI components in `src/components/` — self-contained with their own styles.
- Business hooks in `src/hooks/` (data fetching, WebSocket, state).
- API calls in `src/services/api.service.ts` only.
- Typed navigation: always use `RootStackParamList` from `src/types/navigation.types.ts`.

## Components

- Destructure all props. Never access `props.something` inside component body.
- Explicit TypeScript interface for every component's props.
- Separate styles: co-locate `styles.ts` next to component file, import as `styles`.
- Never inline styles in JSX for anything beyond one-off overrides.
- DitPressable only. Never TouchableOpacity or Pressable (RN core).
- Wrap screens in `ErrorBoundary` — never let a JS error crash the whole app.

## State

- Zustand stores: `auth.store.ts`, `pings.store.ts`, `contacts.store.ts`. Each store owns one domain.
- TanStack Query for all server data (ping history, user info, contacts list).
- WebSocket events update Zustand directly via `store.getState().set()` — never through React Query.
- Never put derived data in store. Compute with selectors.
- Prefer local component state (`useState`) for ephemeral UI state (modal open, input value).

## Server State

Mutations use `useMutation` from `src/hooks/useMutation.ts` — never raw `useReactQueryMutation` or manual try/catch in components.
`useMutation` options:

- `triggerHaptics` (default `true`) — fires `haptics.success()` / `haptics.error()` automatically.
- `showErrorToast` (default `true`) — shows a custom toast (type `error`) with the server `message` and `errorCode`. Set to `false` when the error is surfaced inline (e.g. `form.setError()`).
- `showSuccessToast` (default `false`) — shows a native success toast. Opt in when there is no obvious UI confirmation.
- `successMessage` / `errorMessage` — override the toast text; accepts a string or a function `(data/error) => string`.

Default `TError` is `ApiError` (`AxiosError<ApiErrorResponse>`). The server always returns `{ statusCode, errorCode, message, errorId, timestamp }`.
Queries use `@tanstack/react-query` directly (`useQuery`). `QueryClientProvider` is mounted at the root in `src/app/_layout.tsx`.
Never mix Zustand and TanStack Query for the same data. Zustand = client/UI state, TanStack Query = server state.

## Toasts

Custom toast system — `burnt` is removed. Use `toast` from `src/utils/toast.ts` everywhere:

```typescript
import { toast } from "@/utils/toast";
toast.show({ type: "success", title: "Copied" });
toast.show({ type: "error", title: "Failed", subtitle: "Code: A001" });
toast.show({ type: "warning", title: "Check your connection", duration: 5000 });
toast.hide(); // manual dismiss
```

Types: `'success' | 'warning' | 'error'`. `ToastProvider` must wrap the app root inside `GestureHandlerRootView` in `_layout.tsx`.
Never use `Alert.alert` for transient feedback. Reserve `Alert.alert` for destructive confirmations only.

## Storage

- MMKV for persistent data. Wrap in typed accessors in `src/utils/storage.ts`.
- Never AsyncStorage. It is slower and has no encryption support.
- Access token: memory only (Zustand auth store, lost on app restart → re-auth via refresh token).

## Performance

- Memoize expensive components with `React.memo` when they receive stable props.
- `useMemo`/`useCallback` only for genuinely expensive computations or stable references needed by deps arrays. Do not over-memoize. Profile first.
- `FlatList` for all long lists. Never `map()` → `View` for data lists longer than ~20 items.
- Avoid anonymous functions in JSX when they cause unnecessary re-renders on scroll.

## DRY + Modularity

- If the same data fetching logic appears in two screens, extract a custom hook.
- If the same UI pattern appears in two components, extract a shared component.
- Shared types in `src/types/`. Never duplicate type definitions across files.
- Constants in `src/constants/` — never hardcode strings (endpoints, keys, config) in components.

## TypeScript

- Strict mode. No `any`, no `!`. Explicit return types on all hooks and services.
- Use Zod to validate data coming from the WebSocket (never trust the server).
- Prefer type inference where it is obvious. Annotate explicitly at function/hook boundaries.

## Styling (Unistyles v3)

- NEVER StyleSheet.create(). Always createStyleSheet(theme => ({...})).
- One stylesheet per file, defined at module scope (outside component).
- Access tokens only via useStyles() in components. Never import theme/index.ts directly.
- Dark/light mode is automatic (adaptiveThemes: true). Never check Appearance manually.
- For text on a colored background, always use theme.colors.textOnPrimary —
  never assume the text color (dark mode and light mode differ).
- Prefer `theme.hairline` over the literal `0.5`. Use `theme.avatarSize.*` for avatar dimensions.
- Before redefining a style, check the centralized primitives in `src/components/ui/`
  (`Screen`, `ScreenHeader`, `TabHeader`, `SaveHeaderAction`, `FormCard`, `SettingsCard`/`SettingsRow`,
  `SectionLabel`, `Description`, `Divider`, `ListSeparator`, `Avatar`, `SegmentedTabs`).
  Never inline-duplicate their styles. See `libs-unistyles.md`.
- `SegmentedTabs` is a modern underline-style tab bar (Instagram / Apple Music / App Store pattern):
  horizontally scrollable with dynamic tab widths, an animated underline indicator that follows the
  active tab, hairline baseline, and edge fade gradients when content overflows. Designed for 3+ tabs
  and long labels in any language. Despite the name, it is NOT a pill-style segmented control anymore.

## Color usage rules

- Primary (toxic green) as fill: theme.colors.primary as backgroundColor,
  theme.colors.textOnPrimary as text/icon color on top.
- Primary as text/icon on neutral surface: theme.colors.primary directly.
- Semantic states map to semantic tokens, never to primary:
  - Success toast/badge → colors.success + colors.successSoft
  - Error toast/badge → colors.error + colors.errorSoft
  - Warning toast/badge → colors.warning + colors.warningSoft
  - Info tooltip/hint → colors.info + colors.infoSoft
- Never hardcode any hex value in a component. If a value is not in the theme,
  add it to the theme first, then use it.

## Animation (Reanimated 3)

- withSpring() for ALL user-triggered animations. No exceptions.
- withTiming() only for: progress bars, loading spinners, value readouts.
- Spring presets from src/hooks/useSpring.ts. Never inline damping/stiffness.
- useSharedValue lives in the component that owns the animation. Not in stores.
- useAnimatedStyle is pure: reads shared values only, no side effects.

## Gestures (Gesture Handler)

- GestureDetector + Gesture.\* API only. Old gesture handler components banned.
- runOnJS() required to call any JS-thread function inside gesture callbacks.
- All gesture callbacks (onStart/onUpdate/onEnd) run on the UI thread by default.

## Pressables

- DitPressable from src/components/DitPressable.tsx. The only pressable in the app.
- Choose props deliberately:
  - haptic: matches the semantic weight of the action
  - scale: 'row' for list items, 'card' for cards, 'cta' for primary actions
- Never add scale or haptic manually to any other component.
- Disabled state handled by DitPressable — never add opacity manually.

## Haptics

- Import from src/utils/haptics.ts only. Never expo-haptics directly.
- Semantic mapping (haptic weight must match semantic color of the action):
  - Primary/success (green) → haptics.medium() or haptics.success()
  - Error/destructive (red) → haptics.error()
  - Warning (amber) → haptics.warning()
  - Neutral navigation → haptics.light()
  - Call on press begin, not on result arrival.

## Skia

- Skia is used in: `PingTimeline` (timeline rendering) and `Toast` (tint overlay). Never add Skia to other general UI components.
- Canvas dimensions must be explicit (width + height as numbers). Never flex.
- Animate Skia props via Reanimated shared values only.

## Blur

- BlurView for: bottom sheets, modal overlays, sticky headers.
- Intensity 40–60 for navigation bars and headers.
- Intensity 60–80 for modal overlays.
- Never intensity > 80. Always pair with theme.colors.border for edge definition.
- Android fallback (semi-transparent bg) is acceptable — do not patch it.

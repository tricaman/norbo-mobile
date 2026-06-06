> LIVING DOCUMENT — update this file whenever you:
> introduce a new pattern, convention, or architectural decision;
> discover a library behaviour that differs from what is written here;
> add a new dependency that has rules worth capturing;
> fix a bug caused by violating a rule that is not yet documented.

# Skill: Add a new screen to norbo-mobile

## Steps

1. **Create screen directory** at `src/screens/<ScreenName>/index.tsx` with typed props interface.
2. **Create styles** at `src/screens/<ScreenName>/styles.ts` with `StyleSheet.create()`.
3. **Add to navigation types** — add screen name and params to `RootStackParamList` in `src/types/navigation.types.ts`.
4. **Add route** in the navigation root (`src/app/` directory) using Expo Router file-based routing.
5. **Create data hook** (if screen needs server data): `src/hooks/use<Data>.ts` using TanStack Query with typed query key and return value.
6. **Subscribe to real-time data** (if screen needs WebSocket updates): use Zustand store selector in the hook or component.
7. **Add ErrorBoundary wrapper** — wrap the screen content in an error boundary to prevent crashes from propagating.
8. **Update architecture.md** — add the new screen to the navigation section in `.windsurf/rules/architecture.md`.

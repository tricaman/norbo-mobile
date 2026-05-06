---
description: Given a feature name, creates screen + styles + hook + store slice + API endpoint function + types following all architecture.md conventions.
---

> LIVING DOCUMENT — update this file whenever you:
> introduce a new pattern, convention, or architectural decision;
> discover a library behaviour that differs from what is written here;
> add a new dependency that has rules worth capturing;
> fix a bug caused by violating a rule that is not yet documented.

# Workflow: /add-feature

Given a **feature name**, scaffold all necessary files following Dit mobile conventions.

## Steps

1. **Create types** in `src/types/<feature>.types.ts`:
   - Define all interfaces/types for the feature's data model
   - Export from barrel `src/types/index.ts`

2. **Add API endpoint** in `src/services/api.ts`:
   - Add typed function(s) for the feature's HTTP calls
   - Follow the existing `request<T>()` pattern with explicit return types

3. **Create Zustand store slice** (if client state needed) in `src/stores/<feature>.store.ts`:
   - Define state interface with actions
   - Export `use<Feature>Store` hook
   - Follow single-domain-per-store pattern

4. **Create data hook** (if server state needed) in `src/hooks/use<Feature>.ts`:
   - Use TanStack Query with typed query key
   - Return typed data, loading, and error states

5. **Create screen** at `src/app/<route>.tsx` (Expo Router):
   - Typed props interface
   - Use hooks for data, not direct store/API access in component
   - Compose from centralized UI primitives in `src/components/ui/`:
     `Screen`, `ScreenHeader` (+ `SaveHeaderAction`) for sub-screens,
     `TabHeader` for tab roots, `FormCard` / `SettingsCard` / `SettingsRow`,
     `SectionLabel`, `Description`, `Divider`, `ListSeparator`, `Avatar`.
   - Do NOT re-declare `safe`, `header`, `headerBtn`, `headerTitle`, `card`,
     `cardLabel`, `divider`, `desc`, `sectionLabel`, or `avatar` styles.

6. **Local styles** (only if genuinely screen-specific):
   - Use `StyleSheet.create(theme => ...)` from `react-native-unistyles`
   - Keep to layout that does not fit an existing primitive
   - If the same style appears twice across the app, promote it to a primitive

7. **Add navigation route** in `src/app/` (Expo Router file-based routing):
   - Add to `RootStackParamList` in `src/types/navigation.types.ts`

8. **Add tests**:
   - Component render test + interaction test in `__tests__/`
   - Hook test if custom hook was created
   - Mock API calls at module level

9. **Update docs**:
   - Update `.windsurf/rules/architecture.md` with new screen, store, or data flow
   - Add ADR to `.windsurf/rules/decisions.md` if a design decision was made

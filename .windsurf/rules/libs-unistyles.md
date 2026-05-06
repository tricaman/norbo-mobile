---
trigger: manual
description: "Unistyles v3 patterns. @mention when writing styles, theming, or dark/light mode."
---

> LIVING DOCUMENT — update when a new theme token is added or a styling pattern changes.

## Setup

src/theme/tokens.ts — spacing, radius, typography, pressScale (shared between themes)
src/theme/index.ts — darkTheme + lightTheme, exports DitTheme type
src/theme/unistyles.ts — registry, adaptiveThemes: true
src/app/index.tsx — `import '../theme/unistyles'` as line 1

## Core pattern

createStyleSheet() at module scope. useStyles() inside component.
Access theme.colors._, theme.spacing._, theme.radius._, theme.typography._.
Never import darkTheme or lightTheme directly in components.

## Accessing theme without a stylesheet

const { theme } = useStyles(); // works without a stylesheet argument
Useful for one-off values passed as props.

## Spreading typography tokens

const stylesheet = createStyleSheet((theme) => ({
label: {
...theme.typography.subhead, // spreads fontSize, fontWeight, lineHeight
color: theme.colors.textSecondary,
},
}));

## Adding a new token

Add to src/theme/tokens.ts (if shared) or to both darkTheme and lightTheme objects
(if the value differs between modes). Always add to both themes — TypeScript will error
if the shapes diverge (DitTheme is derived from darkTheme).

## Shared layout tokens

- `theme.hairline` (= 0.5) — border/divider width. Always use it instead of literal `0.5`.
- `theme.avatarSize.{sm,md,lg,xl}` (= 40/46/48/92) — canonical avatar dimensions.

## Centralized primitives (src/components/ui/)

Never re-declare these patterns inline. Reach for the primitive first:

- `Screen` — SafeAreaView + themed background. Replaces every `{ flex: 1, backgroundColor: theme.colors.background }`.
- `ScreenHeader` — sub-screen/modal header with back button + title + optional `right` slot.
- `TabHeader` — tab-root big title (title1 + letterSpacing 2).
- `SaveHeaderAction` — checkmark header button used as ScreenHeader `right` slot on form screens.
- `SectionLabel` — uppercase primary footnote shown above grouped cards.
- `FormCard` — surface card + optional label + internal dividers for form screens. `dividedChildren` prop auto-inserts Dividers between children.
- `Description` — footnote secondary helper text under forms.
- `Divider` — hairline rule with optional `inset` / `marginBottom`.
- `ListSeparator` — FlatList `ItemSeparatorComponent` for avatar-indented rows.
- `Avatar` — circular avatar (`size: sm | md | lg | xl`, defaults to `lg`).
- `SettingsCard` + `SettingsRow` — canonical grouped rows (icon + value + label + optional chevron). Also use this for any "info card" style layout (e.g. viewing another user's profile) — never reimplement.

### Rules

- Do NOT redefine `safe`, `header`, `headerBtn`, `headerTitle`, `cardLabel`, `card`, `divider`, `desc`, `sectionLabel`, or `avatar` styles in a screen. They are centralized.
- If a screen needs a primitive variant, extend the primitive (add a prop) — never copy its styles into the screen.
- Per-screen `StyleSheet.create` should only contain genuinely screen-specific layout (paddings for a body wrapper, empty-state positioning, screen-unique decorations).

export const TAB_BAR_HEIGHT = 80;
export const TAB_BAR_BOTTOM_OFFSET = 24;
export const SCREEN_BOTTOM_PADDING =
  TAB_BAR_HEIGHT + TAB_BAR_BOTTOM_OFFSET + 16;

/**
 * Canonical horizontal padding for tab-screen content areas.
 * Must match TabHeader / PageTitle paddingHorizontal (theme.spacing["3xl"]).
 * Use this literal when you cannot access the theme (e.g. outside StyleSheet.create);
 * inside stylesheets prefer `theme.spacing["3xl"]` directly.
 */
export const SCREEN_HORIZONTAL_PADDING = 32;

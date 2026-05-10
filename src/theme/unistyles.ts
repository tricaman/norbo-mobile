import { StyleSheet } from "react-native-unistyles";
import { darkTheme, lightTheme } from "./index";

type AppThemes = {
  light: typeof lightTheme;
  dark: typeof darkTheme;
};

declare module "react-native-unistyles" {
  export interface UnistylesThemes extends AppThemes {}
}

StyleSheet.configure({
  themes: { light: lightTheme, dark: darkTheme },
  settings: {
    // Default to adaptive (follow OS). The actual mode is overridden
    // synchronously right below by `bootstrapThemeFromStorage()` if the
    // user has previously chosen a forced theme — so the first React
    // render already paints the correct palette (no flash).
    adaptiveThemes: true,
  },
});

// IMPORTANT: keep this import below `StyleSheet.configure(...)` — the
// bootstrap helper calls `UnistylesRuntime.setTheme/setAdaptiveThemes`
// which require the runtime to already be configured.
import { bootstrapThemeFromStorage } from "@/stores/theme.store";

bootstrapThemeFromStorage();

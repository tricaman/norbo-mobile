import Constants from "expo-constants";
import { Platform } from "react-native";

/**
 * Builds the store page URL from the ids configured in `app.config.ts` extra.
 * Used as a fallback when the backend doesn't return a `storeUrl`.
 *
 * - iOS needs the numeric App Store id (`extra.appStoreId`), only known once
 *   the app is live on the App Store. Returns null until it is set.
 * - Android uses the production package name (`extra.androidPackageId`).
 */
export function fallbackStoreUrl(): string | null {
  const extra = Constants.expoConfig?.extra ?? {};

  if (Platform.OS === "ios") {
    const id = extra.appStoreId as string | undefined;
    return id ? `https://apps.apple.com/app/id${id}` : null;
  }

  const pkg = extra.androidPackageId as string | undefined;
  return pkg ? `https://play.google.com/store/apps/details?id=${pkg}` : null;
}

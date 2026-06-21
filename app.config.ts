import type { ConfigContext, ExpoConfig } from "expo/config";

/**
 * app.config.ts — config Expo dinamica controllata da APP_VARIANT.
 *
 * APP_VARIANT viene impostato:
 * - in `eas.json` (build cloud) per profile (development / preview / production)
 * - manualmente in dev locale: `APP_VARIANT=preview pnpm start` (raro)
 * - default: `development`
 *
 * Differenze tra varianti:
 *  - bundle identifier / android package: aggiunto suffisso .dev / .preview
 *    così puoi avere TRE app installate in parallelo sullo stesso device
 *  - nome dell'app visibile all'utente
 *  - file Firebase (firebase/dev/* vs firebase/prod/*)
 *
 * URL backend: lette da EXPO_PUBLIC_API_URL e EXPO_PUBLIC_WS_URL.
 * In dev locale via .env, in EAS build via eas.json env per profile.
 */

type Variant = "development" | "preview" | "production";

const APP_VARIANT = (process.env.APP_VARIANT ?? "development") as Variant;

const IS_DEV = APP_VARIANT === "development";
const IS_PREVIEW = APP_VARIANT === "preview";
const IS_PROD = APP_VARIANT === "production";

const BASE_BUNDLE_ID = "app.mariustrica.norbo";

const bundleIdentifier = IS_DEV
  ? `${BASE_BUNDLE_ID}.dev`
  : IS_PREVIEW
    ? `${BASE_BUNDLE_ID}.preview`
    : BASE_BUNDLE_ID;

const appName = IS_DEV
  ? "norbo (Dev)"
  : IS_PREVIEW
    ? "norbo (Preview)"
    : "norbo";

// I file Firebase per prod stanno in firebase/prod/, dev e preview usano dev.
// (Preview è una build "production-like" per testing interno; usa il
//  progetto Firebase prod così i token FCM sono validi sull'app reale.)
const firebaseDir = IS_PROD || IS_PREVIEW ? "firebase/prod" : "firebase/dev";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: appName,
  slug: "norbo",
  version: "1.5.3",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "norbo",
  userInterfaceStyle: "automatic",
  ios: {
    icon: "./assets/images/icon.png",
    bundleIdentifier,
    buildNumber: "1",
    googleServicesFile: `./${firebaseDir}/GoogleService-Info.plist`,
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/icon.png",
      backgroundColor: "#0E0E0F",
    },
    predictiveBackGestureEnabled: false,
    package: bundleIdentifier,
    versionCode: 10,
    googleServicesFile: `./${firebaseDir}/google-services.json`,
  },
  web: {
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    "@react-native-firebase/app",
    "@react-native-firebase/messaging",
    "./plugins/withAndroidCleartext.js",
    "./plugins/withPodfileModularHeaders.js",
    "./plugins/withNotifee.js",
    "./plugins/withAndroidNotificationIcon.js",
    "./plugins/withAdiRegistration.js",
    "./plugins/withGradleMemory.js",
    "./plugins/withAndroidReleaseSigning.js",
    "expo-font",
    "expo-localization",
    "@react-native-community/datetimepicker",
    [
      "expo-splash-screen",
      {
        // Original full logo (disc + arcs). We may revisit a tighter
        // splash → LandingView continuity later by swapping this image
        // for a disc-only variant; see scripts/generate-splash-icons.js.
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        backgroundColor: "#EAEAEE",
        dark: {
          image: "./assets/images/splash-icon.png",
          backgroundColor: "#000000",
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    router: {},
    eas: {
      projectId: "2025acad-99ed-4d79-a182-13f880bff48d",
    },
    appVariant: APP_VARIANT,
    // Used by the update gate to build a fallback store URL when the backend
    // doesn't return one (see src/utils/store-url.ts).
    // TODO: set `appStoreId` to the numeric App Store id once the app is live.
    appStoreId: "",
    androidPackageId: BASE_BUNDLE_ID,
  },
});

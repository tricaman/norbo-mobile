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

// APNs environment per l'entitlement `aps-environment` (vedi ios.entitlements).
// Le build che spediamo (preview → TestFlight UAT, production → App Store) sono
// firmate con profili AppStore, che portano `aps-environment: production`: il
// valore qui DEVE combaciare o la firma fallisce. Le build development locali
// usano un profilo di sviluppo → sandbox APNs.
const apsEnvironment = IS_DEV ? "development" : "production";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: appName,
  slug: "norbo",
  version: "1.7.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "norbo",
  userInterfaceStyle: "automatic",
  ios: {
    icon: "./assets/images/icon.png",
    supportsTablet: true,
    bundleIdentifier,
    // Numerazione PER-APP e indipendente da UAT: la fonte di verità è lo store
    // dell'app prod, non questo file. Ultimo su TestFlight prod: 2 (1.6.0).
    buildNumber: "3",
    googleServicesFile: `./${firebaseDir}/GoogleService-Info.plist`,
    // Adds the `com.apple.developer.applesignin` entitlement (["Default"]) at
    // prebuild for every variant — required by the native Sign in with Apple
    // sheet. The capability must also be enabled on each App ID in the Apple
    // Developer portal (prod/.dev/.preview), or code signing will fail.
    usesAppleSignIn: true,
    // Push Notifications capability. SENZA questo entitlement iOS rifiuta
    // `registerForRemoteNotifications()` ("no valid aps-environment entitlement
    // string found for application"): il device non riceve mai un token APNs,
    // quindi `getAPNSToken()` torna null e `registerPushToken()` esce senza
    // registrare nulla → zero token IOS a backend → nessuna push sugli iPhone.
    // È esattamente ciò che è successo in prod: 0 token IOS contro 27 ANDROID.
    // `ios/` è gitignored e rigenerato da `expo prebuild` (CNG), quindi
    // l'entitlements file va dichiarato QUI: modificarlo a mano non sopravvive.
    // Il plugin di @react-native-firebase/messaging NON lo aggiunge da sé.
    entitlements: {
      "aps-environment": apsEnvironment,
    },
    infoPlist: {
      // Export compliance: l'app usa solo crittografia standard di sistema
      // (HTTPS/TLS, Apple Sign In, Firebase) → esente dai requisiti di
      // documentazione export. Dichiararlo qui evita il popup "Documentazione
      // relativa alla crittografia dell'app" a ogni upload su TestFlight/App Store.
      ITSAppUsesNonExemptEncryption: false,
      // Consente a iOS di risvegliare l'app per i messaggi in background, così
      // il `setBackgroundMessageHandler` di RN Firebase gira davvero (richiesto
      // dalla documentazione RN Firebase per le push iOS).
      UIBackgroundModes: ["remote-notification"],
      // Posizione (tool "luoghi dog friendly"): richiesta SOLO when-in-use,
      // on-demand dal FAB "vicino a me" — mai al mount, mai in background.
      // Duplicata qui oltre che nel plugin expo-location: greppabile nel repo
      // e sopravvive al prebuild (ios/ è CNG e rigenerato).
      // NON aggiungere NSLocationAlwaysAndWhenInUseUsageDescription: un
      // permesso dichiarato ma mai richiesto attira scrutinio in App Review.
      NSLocationWhenInUseUsageDescription:
        "norbo uses your location to show dog parks and dog-friendly places near you.",
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/icon.png",
      backgroundColor: "#0E0E0F",
    },
    predictiveBackGestureEnabled: false,
    package: bundleIdentifier,
    versionCode: 16,
    googleServicesFile: `./${firebaseDir}/google-services.json`,
    // Google Maps SDK key (tool "luoghi dog friendly") — SOLO Android: iOS usa
    // Apple Maps (PROVIDER_DEFAULT) e non richiede chiavi. ECCEZIONE alla
    // regola "nessuna chiave di terze parti nel bundle client": la Maps SDK
    // richiede la chiave nell'AndroidManifest. Una chiave in un APK è SEMPRE
    // estraibile → si mitiga con le restrizioni, mai con la segretezza:
    // in Google Cloud Console limitarla per package (app.mariustrica.norbo,
    // .dev, .preview) + SHA-1, e alla sola API "Maps SDK for Android".
    // Il nome NON ha il prefisso EXPO_PUBLIC_ apposta: quel prefisso la
    // inlinerebbe anche nel bundle JS. app.config.ts gira in Node al prebuild,
    // quindi legge una env var normale e la chiave finisce solo nel manifest.
    // In EAS: `eas secret:create --name ANDROID_MAPS_API_KEY`; in locale: .env.
    config: {
      googleMaps: { apiKey: process.env.ANDROID_MAPS_API_KEY ?? "" },
    },
  },
  web: {
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    "expo-apple-authentication",
    "@react-native-firebase/app",
    "@react-native-firebase/messaging",
    "./plugins/withAndroidCleartext.js",
    "./plugins/withPodfileModularHeaders.js",
    "./plugins/withNotifee.js",
    "./plugins/withAndroidNotificationIcon.js",
    "./plugins/withAdiRegistration.js",
    "./plugins/withGradleMemory.js",
    "./plugins/withAndroidReleaseSigning.js",
    [
      "expo-location",
      {
        locationWhenInUsePermission:
          "norbo uses your location to show dog parks and dog-friendly places near you.",
        isIosBackgroundLocationEnabled: false,
        isAndroidBackgroundLocationEnabled: false,
        isAndroidForegroundServiceEnabled: false,
      },
    ],
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

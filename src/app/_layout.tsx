import { UpdateGate } from "@/components/app/UpdateGate";
import { ToastProvider } from "@/components/ui/ToastProvider";
import "@/i18n/i18n";
import {
  handleInitialNotification,
  initNotifications,
  setupMessageHandlers,
} from "@/services/notifications";
import { registerPushToken } from "@/services/push-registration";
import { useAuthStore } from "@/stores/auth.store";
import { useLanguageStore } from "@/stores/language.store";
import { useOnboardingStore } from "@/stores/onboarding.store";
import {
  DMMono_400Regular,
  DMMono_500Medium,
} from "@expo-google-fonts/dm-mono";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useUnistyles } from "react-native-unistyles";

// Mantieni lo splash screen di sistema finché non siamo pronti
SplashScreen.preventAutoHideAsync();

export const queryClient = new QueryClient();

export default function RootLayout() {
  const { theme } = useUnistyles();
  const hydrate = useAuthStore((s) => s.hydrate);
  const hydrateLanguage = useLanguageStore((s) => s.hydrate);
  const hydrateOnboarding = useOnboardingStore((s) => s.hydrate);
  const isAuthed = useAuthStore((s) => s.isAuthed);
  const termsAcceptedAt = useAuthStore((s) => s.user?.termsAcceptedAt);
  const toolsDisclaimerAcceptedAt = useAuthStore(
    (s) => s.user?.toolsDisclaimerAcceptedAt,
  );
  const hasCompletedOnboarding = useOnboardingStore((s) => s.hasCompleted);
  const router = useRouter();
  const segments = useSegments();

  const [fontsLoaded, fontError] = useFonts({
    "DMMono-Regular": DMMono_400Regular,
    "DMMono-Medium": DMMono_500Medium,
  });

  // Once fonts (and any other JS deps) are ready we let the native splash
  // hide and the LandingView take over: the splash disc and DitDot's disc
  // share size + colour so the transition is visually continuous.
  const isReady = fontsLoaded || fontError;

  // 1. Idratazione iniziale
  useEffect(() => {
    hydrate();
    hydrateLanguage();
    hydrateOnboarding();
  }, [hydrate, hydrateLanguage, hydrateOnboarding]);

  // 2. Nascondi lo splash nativo SOLO quando i font sono pronti.
  // Prima di questo momento, l'utente vedrà uno sfondo a tinta unita (grazie ad app.json)
  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // 3. Gestione della navigazione in base all'autenticazione
  useEffect(() => {
    // Wait until JS is ready before evaluating redirects.
    if (!isReady) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inOnboardingGroup = segments[0] === "onboarding";
    // OAuth deep-link callback handles its own state and navigation —
    // never gate it through the auth redirect logic.
    const seg0 = segments[0] as string | undefined;
    const seg1 = segments[1] as string | undefined;
    if (seg0 === "auth" && seg1 === "callback") return;

    // Not authenticated → force onto the auth flow.
    if (!isAuthed) {
      if (!inAuthGroup && segments.length > 0) {
        router.replace("/(auth)");
      }
      return;
    }

    // Authenticated but hasn't accepted the Terms of Service (EULA).
    // Lock the user on the onboarding TOS screen — no other navigation
    // is allowed until termsAcceptedAt is set on the profile.
    // Required by Apple / Google store review for user-generated content.
    if (!termsAcceptedAt) {
      if (segments[1] !== "terms") {
        router.replace("/onboarding/terms");
      }
      return;
    }

    // Authenticated + terms accepted but hasn't accepted the Tools &
    // Calculators Disclaimer. Lock the user on that screen next — the
    // Services-tab tools give indicative estimates, not veterinary advice.
    if (!toolsDisclaimerAcceptedAt) {
      if (segments[1] !== "tools-disclaimer") {
        router.replace("/onboarding/tools-disclaimer");
      }
      return;
    }

    // Authenticated + terms accepted but hasn't seen the post-signup
    // onboarding (welcome → theme → notifications). Skippable, but the
    // first time the user reaches this state we route them through it.
    if (!hasCompletedOnboarding) {
      if (segments[1] !== "welcome") {
        router.replace("/onboarding/welcome");
      }
      return;
    }

    // Authenticated + terms accepted + onboarding seen → bounce off
    // the auth/onboarding groups onto the main app.
    if (inAuthGroup || inOnboardingGroup) {
      router.replace("/(tabs)");
    }
  }, [
    isAuthed,
    termsAcceptedAt,
    toolsDisclaimerAcceptedAt,
    hasCompletedOnboarding,
    segments,
    router,
    isReady,
  ]);

  // 4. Deep-link dalla notifica che ha lanciato l'app (stato killed):
  // appena l'utente è autenticato e lo splash è terminato, naviga alla
  // schermata corrispondente se la notifica contiene un target.
  useEffect(() => {
    if (!isReady || !isAuthed) return;
    void handleInitialNotification().then((route) => {
      if (route) router.push(route as never);
    });
  }, [isReady, isAuthed, router]);

  // 5. Initialise notifications after login: request permission, create
  //    Android channels, register iOS categories, wire foreground handlers,
  //    register the FCM token, and keep it fresh on every foreground.
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  useEffect(() => {
    if (!isReady || !isAuthed) return;

    // Full bootstrap (permission + channels + categories + token + onTokenRefresh).
    void initNotifications();
    // Foreground FCM/Notifee event handlers (idempotent).
    setupMessageHandlers();

    // Re-register the token whenever the app comes back to the foreground
    // so lastSeenAt stays fresh and server-side invalidation is recovered.
    const sub = AppState.addEventListener("change", (next) => {
      if (appStateRef.current !== "active" && next === "active") {
        void registerPushToken();
      }
      appStateRef.current = next;
    });
    return () => {
      sub.remove();
    };
  }, [isReady, isAuthed]);

  // While JS isn't ready the native splash (a single themed disc) stays on
  // screen — keep React from rendering anything to avoid a flash.
  if (!isReady) {
    return null;
  }

  // L'app vera e propria
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
      >
        <ToastProvider>
          <AppInner />
        </ToastProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}

function AppInner() {
  const { theme } = useUnistyles();

  return (
    <UpdateGate>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
      <Stack.Screen name="(auth)" options={{ animation: "fade" }} />
      <Stack.Screen name="auth/callback" options={{ animation: "fade" }} />
      <Stack.Screen
        name="onboarding/terms"
        options={{ animation: "fade", gestureEnabled: false }}
      />
      <Stack.Screen
        name="onboarding/tools-disclaimer"
        options={{ animation: "fade", gestureEnabled: false }}
      />
      <Stack.Screen
        name="onboarding/welcome"
        options={{ animation: "fade", gestureEnabled: false }}
      />
      <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
      <Stack.Screen
        name="settings/account"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="settings/language"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="settings/theme"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="settings/notifications"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="pets/index"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="pets/new"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="pets/[id]/index"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="pets/[id]/edit"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="pets/[id]/events/new"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="pets/[id]/events/[eventId]/index"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="pets/[id]/events/[eventId]/edit"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="pets/[id]/weights/index"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="pets/[id]/weights/new"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="pets/[id]/booklet/edit"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="reminder/new"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="reminder/[id]/index"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="reminder/[id]/edit"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="expense/new"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="expense/[id]/index"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="expense/[id]/edit"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="tool/category/[category]"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="tool/[toolId]"
        options={{ animation: "slide_from_right" }}
      />
      </Stack>
    </UpdateGate>
  );
}

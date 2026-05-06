import { ToastProvider } from "@/components/ui/ToastProvider";
import "@/i18n/i18n";
import { handleInitialNotification } from "@/services/notifications";
import { useAuthStore } from "@/stores/auth.store";
import { useLanguageStore } from "@/stores/language.store";
import {
  DMMono_400Regular,
  DMMono_500Medium,
} from "@expo-google-fonts/dm-mono";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useUnistyles } from "react-native-unistyles";

// Mantieni lo splash screen di sistema finché non siamo pronti
SplashScreen.preventAutoHideAsync();

export const queryClient = new QueryClient();

export default function RootLayout() {
  const { theme } = useUnistyles();
  const hydrate = useAuthStore((s) => s.hydrate);
  const hydrateLanguage = useLanguageStore((s) => s.hydrate);
  const isAuthed = useAuthStore((s) => s.isAuthed);
  const termsAcceptedAt = useAuthStore((s) => s.user?.termsAcceptedAt);
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
  }, [hydrate, hydrateLanguage]);

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
      if (!inOnboardingGroup) {
        router.replace("/onboarding/terms");
      }
      return;
    }

    // Authenticated + terms accepted → bounce off the auth/onboarding
    // groups onto the main app.
    if (inAuthGroup || inOnboardingGroup) {
      router.replace("/(tabs)");
    }
  }, [isAuthed, termsAcceptedAt, segments, router, isReady]);

  // 4. Deep-link dalla notifica che ha lanciato l'app (stato killed):
  // appena l'utente è autenticato e lo splash è terminato, apri il dit
  // corrispondente.
  useEffect(() => {
    if (!isReady || !isAuthed) return;
    void handleInitialNotification();
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
      <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
      <Stack.Screen
        name="settings/account"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="settings/language"
        options={{ animation: "slide_from_right" }}
      />
    </Stack>
  );
}

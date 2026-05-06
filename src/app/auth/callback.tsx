import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/stores/auth.store";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useUnistyles } from "react-native-unistyles";

/**
 * Deep-link landing route for OAuth social callbacks.
 *
 * The backend redirects to `norbo://auth/callback?session_token=...` after
 * a successful Google/Facebook/Microsoft sign-in. In the happy path,
 * `WebBrowser.openAuthSessionAsync` in `useAuth.signInWithSocial` intercepts
 * this URL and closes the in-app browser before Expo Router can handle it.
 *
 * On Android (and some iOS configurations) the in-app browser may fail to
 * intercept the custom scheme and the OS opens the app directly via deep link.
 * This route handles that fallback: extract the session token from the query,
 * bootstrap the auth state, then navigate into the app.
 */
export default function AuthCallback() {
  const params = useLocalSearchParams<{ session_token?: string }>();
  const router = useRouter();
  const { theme } = useUnistyles();
  const { completeSignIn } = useAuth();
  const setSessionToken = useAuthStore((s) => s.setSessionToken);
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    (async () => {
      try {
        if (params.session_token) {
          setSessionToken(decodeURIComponent(params.session_token));
        }
        await completeSignIn();
        router.replace("/(tabs)");
      } catch {
        router.replace("/(auth)");
      }
    })();
  }, [params.session_token, completeSignIn, setSessionToken, router]);

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ActivityIndicator size="large" color={theme.colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

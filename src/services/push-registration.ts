import notifee, { AuthorizationStatus } from "@notifee/react-native";
import { getMessaging, getToken } from "@react-native-firebase/messaging";
import * as Crypto from "expo-crypto";
import { Platform } from "react-native";
import { createMMKV } from "react-native-mmkv";
import { api } from "./api";

const storage = createMMKV({ id: "norbo-push-reg" });
const DEVICE_ID_KEY = "deviceId";

/**
 * Returns a stable, per-install device ID.
 * Generated once on first call and persisted in MMKV.
 * A reinstall produces a new UUID (MMKV is cleared on reinstall).
 */
function getOrCreateDeviceId(): string {
  const stored = storage.getString(DEVICE_ID_KEY);
  if (stored) return stored;
  const id = Crypto.randomUUID();
  storage.set(DEVICE_ID_KEY, id);
  return id;
}

/**
 * Register this device's FCM token with the Norbo backend.
 *
 * Idempotent: safe to call on every app foreground and after login.
 * Skips silently if push permission is denied.
 * Clears server-side invalidation if the token was previously marked dead.
 */
export async function registerPushToken(): Promise<void> {
  try {
    const settings = await notifee.getNotificationSettings();
    if (settings.authorizationStatus === AuthorizationStatus.DENIED) return;

    const fcmToken = await getToken(getMessaging());
    const deviceId = getOrCreateDeviceId();
    const platform = Platform.OS === "ios" ? "IOS" : "ANDROID";

    await api.post("/me/push-tokens", { token: fcmToken, platform, deviceId });
  } catch (e) {
    console.warn("[push-registration] registerPushToken failed:", e);
  }
}

/**
 * Unregister this device from push delivery.
 * Call on explicit logout before clearing the session.
 */
export async function unregisterPushToken(): Promise<void> {
  try {
    const deviceId = storage.getString(DEVICE_ID_KEY);
    if (!deviceId) return;
    await api.delete("/me/push-tokens", { data: { deviceId } });
  } catch (e) {
    console.warn("[push-registration] unregisterPushToken failed:", e);
  }
}

/** Expose deviceId for use in the token-refresh handler. */
export function getDeviceId(): string {
  return getOrCreateDeviceId();
}

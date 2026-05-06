import notifee, {
  AndroidImportance,
  AuthorizationStatus,
  EventType,
} from "@notifee/react-native";
import {
  getMessaging,
  getToken,
  onMessage,
  onTokenRefresh,
  setBackgroundMessageHandler,
} from "@react-native-firebase/messaging";
import { Platform } from "react-native";
import { registerPushToken } from "./api";

/**
 * Notification service.
 *
 * After the dit → norbo fork (Phase 4) the notification surface is
 * intentionally generic: a single Android channel, no custom sounds,
 * no domain-specific action buttons, and no real-time WebSocket bridge.
 *
 * Kept:
 *   - FCM token registration with norbo-api
 *   - Foreground / background display via Notifee
 *   - Press-to-dismiss locally
 *
 * Removed:
 *   - dit / dah action buttons and Morse audio
 *   - Cross-device dismissal via WebSocket
 *   - Ping store hydration / optimistic updates
 *
 * The new norbo product surface will reintroduce richer behaviours when
 * its own notification model is defined.
 */

const ANDROID_CHANNEL_ID = "default";

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  await notifee.createChannel({
    id: ANDROID_CHANNEL_ID,
    name: "Notifications",
    importance: AndroidImportance.HIGH,
    vibrationPattern: [50, 100],
  });
}

/** Request notification permissions and register the FCM token. */
export async function initNotifications(): Promise<void> {
  const settings = await notifee.requestPermission();
  if (settings.authorizationStatus === AuthorizationStatus.DENIED) {
    return;
  }

  await ensureAndroidChannel();

  const messaging = getMessaging();
  const fcmToken = await getToken(messaging);
  const platform = Platform.OS === "ios" ? "IOS" : "ANDROID";
  await registerPushToken(fcmToken, platform);

  onTokenRefresh(messaging, async (newToken) => {
    try {
      await registerPushToken(newToken, platform);
    } catch (e) {
      console.warn("[notifications] token refresh failed:", e);
    }
  });
}

/** Display an FCM data-only payload via Notifee. */
async function displayNotification(
  data: Record<string, string>,
): Promise<void> {
  const title = data["title"] ?? "norbo";
  const body = data["body"] ?? "";
  await notifee.displayNotification({
    title,
    body,
    data,
    android: {
      channelId: ANDROID_CHANNEL_ID,
      smallIcon: "ic_notification",
      pressAction: { id: "default" },
    },
    ios: {},
  });
}

let _fgUnsubscribers: Array<() => void> = [];

/** Wire foreground FCM + Notifee handlers. Idempotent. */
export function setupMessageHandlers(): void {
  for (const unsub of _fgUnsubscribers) {
    try {
      unsub();
    } catch {
      // ignore
    }
  }
  _fgUnsubscribers = [];

  const unsubMessage = onMessage(getMessaging(), async (remoteMessage) => {
    if (!remoteMessage.data) return;
    const data = remoteMessage.data as Record<string, string>;
    try {
      await displayNotification(data);
    } catch (e) {
      console.error("[notifications] displayNotification failed:", e);
    }
  });
  _fgUnsubscribers.push(unsubMessage);

  const unsubForeground = notifee.onForegroundEvent(async ({ type, detail }) => {
    if (type !== EventType.PRESS) return;
    if (detail.notification?.id) {
      await notifee.cancelNotification(detail.notification.id);
    }
  });
  _fgUnsubscribers.push(unsubForeground);
}

/**
 * Read the notification that launched the app (cold start) and dismiss it.
 * No domain-specific navigation yet — that will be reintroduced when the
 * norbo product surface defines its own deep-link targets.
 */
export async function handleInitialNotification(): Promise<void> {
  try {
    const initial = await notifee.getInitialNotification();
    if (initial?.notification?.id) {
      await notifee.cancelNotification(initial.notification.id);
    }
  } catch (e) {
    console.warn("[notifications] handleInitialNotification failed:", e);
  }
}

/**
 * Background FCM + Notifee handlers. Must be registered at the entry
 * point (entry.ts) for Android headless JS to find them.
 */
export function registerBackgroundHandler(): void {
  setBackgroundMessageHandler(getMessaging(), async (remoteMessage) => {
    if (!remoteMessage.data) return;
    const data = remoteMessage.data as Record<string, string>;
    try {
      await displayNotification(data);
    } catch (e) {
      console.error(
        "[notifications] background displayNotification failed:",
        e,
      );
    }
  });

  notifee.onBackgroundEvent(async ({ type, detail }) => {
    if (type !== EventType.PRESS) return;
    if (detail.notification?.id) {
      await notifee.cancelNotification(detail.notification.id);
    }
  });
}

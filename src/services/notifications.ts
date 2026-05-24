import notifee, {
  AndroidImportance,
  AuthorizationStatus,
  EventType,
} from "@notifee/react-native";
import {
  getMessaging,
  onMessage,
  onTokenRefresh,
  setBackgroundMessageHandler,
} from "@react-native-firebase/messaging";
import { addDays } from "date-fns";
import { Linking, Platform } from "react-native";
import { registerPushToken } from "./push-registration";
import { remindersApi } from "./reminders.api";

const ANDROID_CHANNEL_DEFAULT = "default";
const ANDROID_CHANNEL_REMINDERS = "reminders";
const IOS_CATEGORY_REMINDERS = "REMINDER_ACTIONS";

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  await notifee.createChannel({
    id: ANDROID_CHANNEL_DEFAULT,
    name: "Notifications",
    importance: AndroidImportance.HIGH,
    vibrationPattern: [50, 100],
  });
  await notifee.createChannel({
    id: ANDROID_CHANNEL_REMINDERS,
    name: "Reminders",
    importance: AndroidImportance.HIGH,
    vibrationPattern: [50, 100],
  });
}

async function ensureIosCategories(): Promise<void> {
  if (Platform.OS !== "ios") return;
  await notifee.setNotificationCategories([
    {
      id: IOS_CATEGORY_REMINDERS,
      actions: [
        { id: "done", title: "Done" },
        { id: "snooze_24h", title: "Tomorrow" },
      ],
    },
  ]);
}

/**
 * Request notification permissions, set up channels/categories, register
 * the FCM token, and wire the token-refresh listener.
 */
export async function initNotifications(): Promise<void> {
  const settings = await notifee.requestPermission();
  if (settings.authorizationStatus === AuthorizationStatus.DENIED) {
    return;
  }

  await ensureAndroidChannel();
  await ensureIosCategories();

  await registerPushToken();

  onTokenRefresh(getMessaging(), async () => {
    await registerPushToken();
  });
}

/** Display an FCM data-only payload via Notifee. */
async function displayNotification(
  data: Record<string, string>,
): Promise<void> {
  const title = data["title"] ?? "norbo";
  const body = data["body"] ?? "";
  const isReminder = data["action"] === "reminder";

  await notifee.displayNotification({
    title,
    body,
    data,
    android: {
      channelId: isReminder
        ? ANDROID_CHANNEL_REMINDERS
        : ANDROID_CHANNEL_DEFAULT,
      smallIcon: "ic_notification",
      pressAction: { id: "default" },
      actions: isReminder
        ? [
            { title: "Done", pressAction: { id: "done" } },
            { title: "Tomorrow", pressAction: { id: "snooze_24h" } },
          ]
        : undefined,
    },
    ios: {
      categoryId: isReminder ? IOS_CATEGORY_REMINDERS : undefined,
    },
  });
}

/**
 * Handle a reminder quick action (tap on action button in notification).
 * Calls the appropriate API endpoint and cancels the notification.
 */
async function handleReminderAction(detail: {
  pressAction?: { id: string };
  notification?: { id?: string; data?: Record<string, unknown> };
}): Promise<void> {
  const reminderId = detail.notification?.data?.["reminderId"];
  if (typeof reminderId !== "string" || !reminderId) return;

  const actionId = detail.pressAction?.id;
  try {
    if (actionId === "done") {
      await remindersApi.complete(reminderId);
    } else if (actionId === "snooze_24h") {
      const until = addDays(new Date(), 1).toISOString();
      await remindersApi.snooze(reminderId, until);
    }
  } catch (e) {
    console.warn("[notifications] reminder action failed:", e);
  }

  if (detail.notification?.id) {
    await notifee.cancelNotification(detail.notification.id);
  }
}

let _fgUnsubscribers: (() => void)[] = [];

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

  const unsubForeground = notifee.onForegroundEvent(
    async ({ type, detail }) => {
      if (type === EventType.ACTION_PRESS) {
        await handleReminderAction(
          detail as Parameters<typeof handleReminderAction>[0],
        );
        return;
      }
      if (type === EventType.PRESS) {
        if (detail.notification?.id) {
          await notifee.cancelNotification(detail.notification.id);
        }
        const reminderId = detail.notification?.data?.["reminderId"];
        if (typeof reminderId === "string" && reminderId) {
          try {
            await Linking.openURL(`norbo://reminder/${reminderId}`);
          } catch (e) {
            console.warn("[notifications] deep link failed:", e);
          }
        }
      }
    },
  );
  _fgUnsubscribers.push(unsubForeground);
}

/**
 * Read the notification that launched the app (cold start) and return the
 * deep link route to navigate to, if any.
 */
export async function handleInitialNotification(): Promise<string | null> {
  try {
    const initial = await notifee.getInitialNotification();
    if (!initial?.notification) return null;

    const { id, data } = initial.notification;
    if (id) await notifee.cancelNotification(id);

    const reminderId = data?.["reminderId"];
    if (typeof reminderId === "string" && reminderId) {
      return `/reminder/${reminderId}`;
    }
    return null;
  } catch (e) {
    console.warn("[notifications] handleInitialNotification failed:", e);
    return null;
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
    if (type === EventType.ACTION_PRESS) {
      await handleReminderAction(
        detail as Parameters<typeof handleReminderAction>[0],
      );
      return;
    }
    if (type === EventType.PRESS) {
      if (detail.notification?.id) {
        await notifee.cancelNotification(detail.notification.id);
      }
    }
  });
}

import notifee, {
  AndroidImportance,
  AuthorizationStatus,
  EventType,
} from "@notifee/react-native";
import {
  getInitialNotification,
  getMessaging,
  onMessage,
  onNotificationOpenedApp,
  onTokenRefresh,
  setBackgroundMessageHandler,
} from "@react-native-firebase/messaging";
import { BADGE_DATA_TYPE } from "@/shared/gamification-contract";
import { addDays } from "date-fns";
import { Linking, Platform } from "react-native";
import {
  CAMPAIGN_DATA_TYPE,
  resolveCampaignTarget,
} from "./campaign-targets";
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

/**
 * Resolve the in-app deep-link route for a notification's data payload.
 *
 * Central routing table for every notification kind:
 *   - campaigns: `type === "campaign"` + a symbolic `target` whose params
 *                were resolved per recipient server-side (campaign-targets.ts).
 *   - reminders: identified by a `reminderId` (legacy shape, no `type`).
 *   - news:      identified by `type === "news"` + a `newsId`.
 *   - badges:    identified by `type === "badge"` + a `badgeId`.
 * Returns `null` when the payload carries no navigable target.
 *
 * The returned value is an app route (e.g. `/news/abc`); callers that need a
 * URL scheme build `norbo://<route without leading slash>` from it.
 */
export function getNavTargetFromData(
  data: Record<string, unknown> | undefined,
): string | null {
  if (!data) return null;

  // Checked first: campaign payloads are self-describing, and a campaign
  // linking to a news item also carries `newsId`. Dispatching on the exact
  // discriminator up front keeps both kinds unambiguous.
  if (data["type"] === CAMPAIGN_DATA_TYPE) {
    return resolveCampaignTarget(data);
  }

  const reminderId = data["reminderId"];
  if (typeof reminderId === "string" && reminderId) {
    return `/reminder/${reminderId}`;
  }

  const newsId = data["newsId"];
  if (data["type"] === "news" && typeof newsId === "string" && newsId) {
    return `/news/${newsId}`;
  }

  // Badge unlocks. The detail is a sheet, not a route, so the target is the
  // grid screen with the badge pre-selected via a query param.
  const badgeId = data["badgeId"];
  if (
    data["type"] === BADGE_DATA_TYPE &&
    typeof badgeId === "string" &&
    badgeId
  ) {
    return `/badges?badgeId=${encodeURIComponent(badgeId)}`;
  }

  return null;
}

/** Open the `norbo://` deep link for a nav route, if the payload has one. */
async function openDeepLink(
  data: Record<string, unknown> | undefined,
): Promise<void> {
  const route = getNavTargetFromData(data);
  if (!route) return;
  try {
    await Linking.openURL(`norbo://${route.replace(/^\//, "")}`);
  } catch (e) {
    console.warn("[notifications] deep link failed:", e);
  }
}

/** Display an FCM data-only payload via Notifee. */
async function displayNotification(
  data: Record<string, string>,
): Promise<void> {
  // The worker injects `notifee_title` / `notifee_body` for data-only
  // pushes (e.g. news). Reminders arrive with top-level `title` / `body`
  // which the worker also mirrors into the `notifee_*` keys, so preferring
  // `title`/`body` first keeps reminders working and news renders via the
  // worker's keys.
  const title = data["title"] ?? data["notifee_title"] ?? "norbo";
  const body = data["body"] ?? data["notifee_body"] ?? "";
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

export interface MessageHandlerOptions {
  /**
   * Called when a push lands while the app is in the foreground. The caller
   * owns the cache: this module stays free of react-query, which also keeps
   * it importable from `_layout` without an import cycle.
   */
  onForegroundMessage?: () => void;
}

/** Wire foreground FCM + Notifee handlers. Idempotent. */
export function setupMessageHandlers(opts: MessageHandlerOptions = {}): void {
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
    // The inbox row was written server-side when the push was delivered, so
    // let the caller refresh the list and the tab badge — neither polls, and
    // the `(tabs)` layout stays mounted, so nothing else would move it.
    opts.onForegroundMessage?.();
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
        await openDeepLink(detail.notification?.data);
      }
    },
  );
  _fgUnsubscribers.push(unsubForeground);

  // iOS: notifications delivered while the app is in background/killed are
  // displayed by the OS itself (from the `aps.alert` the worker sends), NOT by
  // Notifee — so their tap is reported by RN Firebase, not by Notifee's events.
  // Route it through the same table so tapping a news push opens the article,
  // matching Android. On Android these pushes are data-only (Notifee-rendered),
  // so this never fires there — no double handling.
  const unsubOpened = onNotificationOpenedApp(
    getMessaging(),
    async (remoteMessage) => {
      await openDeepLink(remoteMessage?.data);
    },
  );
  _fgUnsubscribers.push(unsubOpened);
}

/**
 * Read the notification that launched the app (cold start) and return the
 * deep link route to navigate to, if any.
 */
export async function handleInitialNotification(): Promise<string | null> {
  try {
    // Notifee-rendered notifications (Android; iOS foreground) that cold-started
    // the app.
    const initial = await notifee.getInitialNotification();
    if (initial?.notification) {
      const { id, data } = initial.notification;
      if (id) await notifee.cancelNotification(id);
      const route = getNavTargetFromData(data);
      if (route) return route;
    }

    // iOS: a notification the OS displayed itself (background/killed, from
    // `aps.alert`) is not a Notifee notification, so a cold-start tap surfaces
    // through RN Firebase instead. Android data-only pushes never reach here.
    const fcmInitial = await getInitialNotification(getMessaging());
    if (fcmInitial?.data) {
      return getNavTargetFromData(fcmInitial.data);
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
      await openDeepLink(detail.notification?.data);
    }
  });
}

---
trigger: manual
description: "Notifee patterns for norbo-mobile. @mention when working on notifications, action buttons, or background handlers."
---

> LIVING DOCUMENT — update this file whenever you:
> introduce a new pattern, convention, or architectural decision;
> discover a library behaviour that differs from what is written here;
> add a new dependency that has rules worth capturing;
> fix a bug caused by violating a rule that is not yet documented.

# Notifee Patterns — norbo-mobile

## Channel Setup (Android)

Create the channel **once** at app startup, before any notification can arrive:

```typescript
await notifee.createChannel({
  id: "dit-pings",
  name: "Pings",
  importance: AndroidImportance.HIGH,
  vibration: true,
});
```

- Channel ID `dit-pings` is the only channel. Add more only if distinct notification categories are needed.
- Channel creation is idempotent — safe to call on every launch.

## Category Registration (iOS)

Register action categories at startup so iOS knows about action buttons:

```typescript
await notifee.setNotificationCategories([
  {
    id: "PING_ACTIONS",
    actions: [
      { id: "dah", title: "Dah", foreground: true },
      { id: "ignore", title: "Ignore", destructive: true },
    ],
  },
]);
```

- **Must be registered before any notification arrives.** Call in the root layout component or before `registerBackgroundHandler`.
- `foreground: true` on `dah` brings the app to foreground on tap.

## Displaying Notifications

Always data-only FCM → Notifee local display. Never use FCM notification payloads.

```typescript
await notifee.displayNotification({
  title: "Dit",
  body: `${senderName} pinged you`,
  data: { pingId },
  android: {
    channelId: "dit-pings",
    pressAction: { id: "default" },
    importance: AndroidImportance.HIGH,
    actions: [
      { title: "Dah", pressAction: { id: "dah" } },
      { title: "Ignore", pressAction: { id: "ignore" } },
    ],
  },
  ios: {
    categoryId: "PING_ACTIONS",
    sound: "default",
    interruptionLevel: "timeSensitive",
  },
});
```

## Background Event Handler

**Registration order matters:**

1. `messaging().setBackgroundMessageHandler()` — registered at module top level (outside React).
2. `notifee.onBackgroundEvent()` — registered at module top level (outside React).
3. Both must be registered before the React tree mounts.

```typescript
// In index.js or app entry point, BEFORE AppRegistry.registerComponent
import { registerBackgroundHandler } from "@/services/notifications";
registerBackgroundHandler();
```

## Foreground Event Handler

Register inside React tree (e.g., root layout `useEffect`):

```typescript
useEffect(() => {
  const unsubMessage = messaging().onMessage(handleForegroundMessage);
  const unsubNotifee = notifee.onForegroundEvent(handleNotifeeEvent);
  return () => {
    unsubMessage();
    unsubNotifee();
  };
}, []);
```

## Action Handling

```typescript
notifee.onForegroundEvent(({ type, detail }) => {
  if (type === EventType.ACTION_PRESS) {
    const pingId = detail.notification?.data?.pingId;
    if (detail.pressAction?.id === "dah") {
      usePingStore.getState().dahPing(pingId);
    } else if (detail.pressAction?.id === "ignore") {
      usePingStore.getState().ignorePing(pingId);
    }
  }
});
```

- Always read `pingId` from `detail.notification.data`, never from notification title/body.
- Update Zustand store directly from action handlers.

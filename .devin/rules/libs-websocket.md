---
trigger: manual
description: "WebSocket service patterns. @mention when working on real-time connection logic."
---

> LIVING DOCUMENT — update this file whenever you:
> introduce a new pattern, convention, or architectural decision;
> discover a library behaviour that differs from what is written here;
> add a new dependency that has rules worth capturing;
> fix a bug caused by violating a rule that is not yet documented.

# WebSocket Service Patterns — norbo-mobile

## Singleton

`src/services/websocket.ts` exports a singleton `pingSocket` instance of `PingSocket`. Never create additional instances.

## Auth Flow

1. Call `pingSocket.connect()` after successful login (auth store action).
2. On `WebSocket.onopen` → immediately send `{ type: "auth", token: "<accessToken>" }`.
3. Server responds with `{ type: "authed", userId }` → set `connected = true` in ping store.
4. If auth fails → server sends `{ type: "error", code: "auth_failed" }` → disconnect and clear tokens.

## Heartbeat

- Send `{ type: "heartbeat" }` every **30 seconds** via `setInterval`.
- Server responds with `{ type: "heartbeat_ack" }`.
- If no `heartbeat_ack` received within 60 seconds → consider connection dead, trigger reconnect.
- Clear interval on disconnect or `WebSocket.onclose`.

## Reconnect Backoff

- On `WebSocket.onclose` or `WebSocket.onerror` → schedule reconnect.
- Exponential backoff: `min(1000 * 2^attempts, 30000)` milliseconds.
- Reset `reconnectAttempts` to 0 on successful connection (`onopen`).
- Cancel pending reconnect timeout on explicit `disconnect()`.

## Message Type Discrimination

All messages are JSON with a `type` string field. Parse and narrow:

```typescript
type IncomingMessage =
  | { type: 'authed'; userId: string }
  | { type: 'ping_in'; pingId: string; senderId: string; ... }
  | { type: 'acked'; pingId: string; ackedAt: string }
  | { type: 'expired'; pingId: string }
  | { type: 'error'; code: string; message: string }
  | { type: 'heartbeat_ack' };
```

- Validate incoming messages with Zod before acting on them (never trust the server).
- Ignore unknown `type` values silently (forward compatibility).

## Integration with Zustand

- `PingSocket.onMessage()` returns an unsubscribe function.
- Ping store subscribes at creation time and updates state directly.
- Never update React Query cache from WebSocket events — only Zustand.

## Lifecycle Rules

- **Connect** on login success.
- **Disconnect** on logout.
- **Reconnect** on app foreground (if was connected before background).
- **Pause heartbeat** on app background (OS will kill the socket anyway).

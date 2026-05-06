# norbo-mobile — React Native App

## Overview

norbo-mobile is the mobile client for the Dit application. Built with React Native (Expo), it handles authentication, real-time ping/dah signaling via WebSocket, contact management, and push notifications. Uses Zustand for state management and axios for REST API calls.

## Architecture

### Tech Stack

- **Framework**: React Native (Expo SDK 52)
- **Router**: Expo Router (file-based routing)
- **State**: Zustand (persistent via MMKV)
- **HTTP**: axios (with session cookie injection)
- **WebSocket**: Native WebSocket API
- **Push**: Notifee (local notifications) + Firebase Cloud Messaging
- **UI**: React Native Paper, Lucide icons, custom components

### Core Services

#### AuthService (`services/auth.api.ts`)

- **Email OTP**: `sendOtp()`, `verifyOtp()`
- **Social OAuth**: `getSocialRedirectUrl()` — Opens system browser with state cookie
- **WebSocket JWT**: `getWsToken()` — Fetches short-lived JWT for dit-ping auth
- **Session management**: Session token stored in MMKV, injected as Cookie header

#### PingsService (`services/pings.api.ts`)

- **Create ping**: `POST /pings` — REST call to norbo-api (NOT via WebSocket)
- **Conversations**: `GET /pings/conversations` — Fetch conversation list
- **History**: `GET /pings/history/:userId` — Paginated ping history
- **REST fallback**: `dahPing()`, `ignorePing()` — For background actions when WS unavailable

#### WebSocketService (`services/websocket.service.ts`)

- Singleton service managing persistent connection to dit-ping (:8080)
- **Connection flow**:
  1. Fetch `wsToken` from norbo-api (`POST /auth/ws-token`)
  2. Connect to `ws://localhost:8080/ws`
  3. Send `{type:"auth", token:wsToken}`
  4. Receive `{type:"authed", userId}`
  5. Start heartbeat (30s interval, 60s timeout)
- **Reconnect**: Exponential backoff (1s → 2s → 4s → max 30s)
- **Token refresh**: Calls `tokenRefresher` callback before reconnect if token near expiry
- **Event emitter**: Emits `ping_in`, `dahed`, `expired`, `connected`, `disconnected`

#### ContactsService (`services/contacts.api.ts`)

- CRUD for contacts with optional nicknames
- Display name resolution: `nickname ?? name ?? username ?? 'Unknown'`

#### UsersService (`services/users.api.ts`)

- User profile management
- User search by username

### State Management (Zustand)

#### AuthStore (`stores/auth-store.ts`)

- **State**: `user`, `wsToken`, `sessionToken`, `isAuthed`, `isVerified`
- **Persistence**: MMKV for `user` and `sessionToken` (wsToken is ephemeral)
- **Hydration**: Restores user on app start, wsToken fetched fresh after session validation

#### PingsStore (`stores/pings.store.ts`)

- **State**: `pings` (map by pingId), `conversations`, `unreadCount`
- **Actions**:
  - `addOutboundPing()` — Optimistic update after `POST /pings`
  - `addInboundPing()` — Called when `ping_in` arrives via WebSocket
  - `markDahed()`, `markExpired()` — Update ping status from WebSocket events
  - `fetchConversations()`, `fetchHistory()`

#### ContactsStore (`stores/contacts-store.ts`)

- **State**: `contacts` (array), `contactsMap` (by userId)
- **Actions**: `fetchContacts()`, `addContact()`, `updateContact()`, `deleteContact()`

### Hooks

#### useAuth (`hooks/useAuth.ts`)

- `signInWithOtp()` — OTP flow, fetches wsToken, connects WebSocket
- `signInWithSocial()` — Opens system browser, handles deep-link callback
- `signOut()` — Clears session, disconnects WebSocket
- `sendOtp()` — Sends OTP to email
- `refreshWsToken()` — Refreshes wsToken (used by WebSocket reconnect)

#### useWebSocket (`hooks/useWebSocket.ts`)

- Connects WebSocket when `isAuthed && wsToken` are true
- Wires WebSocket events to Zustand store actions:
  - `ping_in` → `usePingsStore.addInboundPing()`
  - `dahed` → `usePingsStore.markDahed()`
  - `expired` → `usePingsStore.markExpired()`
- Disconnects on sign-out

#### usePings (`hooks/usePings.ts`)

- `useSendPing()` — Sends `POST /pings`, adds to store
- `useDahPing()` — Sends `{type:"dah"}` via WebSocket
- `useIgnorePing()` — Sends `{type:"ignore"}` via WebSocket
- `useConversations()` — Fetches conversation list
- `usePingHistory()` — Fetches paginated history

### Authentication Flow

#### Email OTP

```
1. User enters email → sendOtp()
2. Brevo sends OTP email
3. User enters OTP → verifyOtp()
4. norbo-api creates session, returns user + sets session cookie
5. Mobile extracts session token, stores in MMKV
6. Fetch wsToken → POST /auth/ws-token
7. Connect WebSocket with wsToken
```

#### Social OAuth (Google/Facebook/Microsoft)

```
1. User taps "Sign in with Google"
2. Mobile opens GET /auth/social-redirect?provider=google&callbackURL=dit://auth/callback
   in system browser (expo-web-browser)
3. norbo-api sets state cookie, redirects to Google
4. Google callback → norbo-api → creates/finds user, sets session cookie
5. norbo-api redirects to dit://auth/callback?session_token=...
6. Mobile intercepts deep link, extracts session_token, stores in MMKV
7. Fetch wsToken → POST /auth/ws-token
8. Connect WebSocket with wsToken
```

### Ping Flow (Aligned to Spec)

**Send ping**:

```
User taps "Send Dit" → useSendPing()
                         ↓
                    POST /pings (REST to norbo-api)
                         ↓
                    addOutboundPing() (optimistic update)
                         ↓
                    norbo-api → INSERT + PUBLISH ping:pubsub:{recipientId}
                         ↓
                    dit-ping → WebSocket → recipient mobile
```

**Receive ping** (online):

```
dit-ping → {type:"ping_in", pingId, senderId, ttlSeconds, ...}
            ↓
       WebSocketService.emit("ping_in")
            ↓
       useWebSocket → usePingsStore.addInboundPing()
            ↓
       UI updates (conversation list, notification badge)
```

**Receive ping** (offline):

```
norbo-api → BullMQ → dit-worker → FCM/APNs
                                   ↓
                              Mobile receives push
                                   ↓
                              Notifee displays notification
                                   ↓
                              User taps → opens app → fetches conversations
```

**Dah ping**:

```
User taps "Dah" → useDahPing()
                    ↓
               wsService.send({type:"dah", pingId})
                    ↓
               markDahed() (optimistic update)
                    ↓
               dit-ping → UPDATE status=DAHED
                    ↓
               dit-ping → {type:"dahed", pingId, dahedAt} → sender mobile
```

**TTL expiry**:

```
dit-ping → time.AfterFunc fires → UPDATE status=EXPIRED
                                     ↓
                                {type:"expired", pingId}
                                     ↓
                                Both sender and recipient receive event
                                     ↓
                                markExpired() updates UI
```

### Navigation Structure

```
app/
├── _layout.tsx           # Root layout, auth hydration, WebSocket init
├── (auth)/
│   ├── sign-in.tsx       # Email OTP + social OAuth
│   └── verify-otp.tsx    # OTP verification
├── (tabs)/
│   ├── _layout.tsx       # Bottom tabs
│   ├── index.tsx         # Dits (conversations)
│   ├── contacts.tsx      # Contacts list
│   └── profile.tsx       # User profile
├── dit/[userId].tsx      # Dit detail (ping history)
└── user-profile/[userId].tsx  # Other user's profile
```

### Environment Variables

```
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_WS_URL=ws://localhost:8080/ws
```

### Key Design Decisions

1. **Ping creation is REST** — `POST /pings` to norbo-api, NOT via WebSocket
2. **Dah/Ignore via WebSocket** — Real-time, low-latency
3. **Session token in Cookie header** — axios interceptor injects `better-auth.session_token`
4. **WebSocket JWT is ephemeral** — Fetched fresh after login, refreshed on reconnect
5. **Optimistic updates** — UI updates immediately, server confirms via WebSocket events
6. **Deep-link OAuth** — System browser for OAuth, session token extracted from callback URL
7. **MMKV for persistence** — Fast, synchronous, encrypted storage

### Running

```bash
npm install
npx expo start
# iOS: npx expo run:ios
# Android: npx expo run:android
```

### Related Services

- **norbo-api** (NestJS :3000) — REST API, authentication, ping creation
- **dit-ping** (Go :8080) — WebSocket server for real-time signaling
- **dit-worker** (Node) — BullMQ consumer for push notifications

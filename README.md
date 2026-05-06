# norbo-mobile

Minimal presence signaling app. **Not chat. Confidential by design.**

Two people. One signal. A dit (ping sent) or a dah (ping acknowledged). Nothing persists unless you want it to.

---

## Tech stack

| Layer        | Choice                                                    |
| ------------ | --------------------------------------------------------- |
| Framework    | Expo bare workflow, React Native 0.83+ (New Architecture) |
| Navigation   | Expo Router (file-based)                                  |
| Styling      | react-native-unistyles v3                                 |
| Client state | Zustand                                                   |
| Server state | TanStack Query v5                                         |
| Storage      | react-native-mmkv (encrypted)                             |
| Animations   | react-native-reanimated v3                                |
| Gestures     | react-native-gesture-handler                              |
| Real-time    | Native WebSocket → dit-ping (Go)                          |
| Auth         | BetterAuth (session cookie) via norbo-api                   |
| Push         | FCM/APNs → Notifee                                        |
| Canvas       | @shopify/react-native-skia (PingTimeline only)            |

**iOS and Android only. No web.**

---

## Prerequisites

### Node / package manager

```bash
node --version   # 20+
pnpm --version   # 9+
```

Use the pinned Node version:

```bash
nvm use          # reads .nvmrc
```

### Firebase (required for push notifications)

L'app usa Firebase Cloud Messaging via due progetti separati: **dev** e **prod**. I file di config NON sono in repo (gitignored) ma vengono inclusi nei build EAS via `.easignore`. Devi metterli localmente sotto `firebase/dev/` e `firebase/prod/`:

```
firebase/
├── dev/
│   ├── google-services.json          # progetto Firebase di sviluppo (Android)
│   └── GoogleService-Info.plist      # progetto Firebase di sviluppo (iOS)
└── prod/
    ├── google-services.json          # progetto Firebase di produzione (Android)
    └── GoogleService-Info.plist      # progetto Firebase di produzione (iOS)
```

Bundle ID / package usati (da `app.config.ts`):

| Variant       | iOS bundle id                 | Android package               | Firebase project |
| ------------- | ----------------------------- | ----------------------------- | ---------------- |
| `development` | `com.mariustrica.dit.dev`     | `com.mariustrica.dit.dev`     | `firebase/dev`   |
| `preview`     | `com.mariustrica.dit.preview` | `com.mariustrica.dit.preview` | `firebase/prod`  |
| `production`  | `com.mariustrica.dit`         | `com.mariustrica.dit`         | `firebase/prod`  |

Nei progetti Firebase (Console → Project settings → Your apps) registra app per ognuno dei bundle id che vuoi supportare. Se cambi un bundle id, **scarica nuovi** `google-services.json` / `GoogleService-Info.plist`.

Per la **service account** del backend (Firebase Admin SDK in norbo-api/dit-worker), vedi `dit-infra/README.md` § Variabili `.env.prod`.

### Backend services

The app talks to two backends. Both must be running locally for full functionality:

| Service  | Default URL              | Purpose                               |
| -------- | ------------------------ | ------------------------------------- |
| norbo-api  | `http://localhost:3000`  | REST — auth, contacts, push tokens    |
| dit-ping | `ws://localhost:8080/ws` | WebSocket — real-time ping/dah events |

Configure in `.env` (copy from `.env.example`):

```bash
cp .env.example .env
```

Key variables:

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_WS_URL=ws://localhost:8080/ws
```

**Important:** dit-ping uses plain `ws://`, not `wss://`. The wrong scheme silently fails to connect.

---

## Setup

```bash
pnpm install
```

### iOS

```bash
cd ios && pod install && cd ..
pnpm ios
```

### Android

```bash
pnpm android
```

> Expo Go is **not supported** — the app requires native modules (Notifee, MMKV, Firebase) unavailable in Expo Go. Always use a development build.

---

## Development

```bash
pnpm start        # Metro bundler (APP_VARIANT=development by default)
pnpm ios          # run on iOS simulator / device
pnpm android      # run on Android emulator / device
pnpm lint         # ESLint
```

In dev locale Metro legge le URL backend da `.env`. Per testare l'app contro la **prod** in dev locale (raro, utile per debug):

```bash
EXPO_PUBLIC_API_URL=https://norbo-api.mariustrica.com \
EXPO_PUBLIC_WS_URL=wss://dit-ws.mariustrica.com/ws \
APP_VARIANT=preview \
pnpm start
```

---

## Production builds (EAS)

La config Expo è in `app.config.ts` ed è **dinamica** rispetto a `APP_VARIANT`:

### Profili EAS e bundle id

| Profile EAS   | `APP_VARIANT` | Bundle ID                 | App name    | Firebase        | URL backend           |
| ------------- | ------------- | ------------------------- | ----------- | --------------- | --------------------- |
| `development` | `development` | `com.mariustrica.dit.dev` | `dit (Dev)` | `firebase/dev`  | `.env` locale         |
| `preview`     | `production`  | `com.mariustrica.dit`     | `dit`       | `firebase/prod` | hardcoded in eas.json |
| `internal`    | `production`  | `com.mariustrica.dit`     | `dit`       | `firebase/prod` | hardcoded in eas.json |
| `production`  | `production`  | `com.mariustrica.dit`     | `dit`       | `firebase/prod` | hardcoded in eas.json |

- `preview` e `internal` = stesso binario della prod, solo con `distribution: internal` (APK installabile via QR/link senza passare dagli store).
- `production` = `.aab` per Play Store, `.ipa` per App Store.

Il bundle id `com.mariustrica.dit.dev` (diverso da quello prod) permette di **avere l'app di sviluppo E quella di produzione installate in parallelo** sullo stesso device.

> Se in futuro vuoi un bundle id `com.mariustrica.dit.preview` separato, devi prima registrarlo come app nel progetto Firebase `dit-prod` e ri-scaricare `google-services.json`/`GoogleService-Info.plist`, poi in `eas.json` cambi `APP_VARIANT=preview`. Il supporto è già presente in `app.config.ts`.

### Setup iniziale EAS (una volta sola)

```bash
# Login EAS
eas login

# Verifica setup (deve riconoscere i 4 profili)
eas build:list
```

### Build cloud

```bash
# Build di sviluppo (development client per Metro)
eas build --profile development --platform ios
eas build --profile development --platform android

# Preview interna (APK / IPA installabile via QR — punta a prod backend)
eas build --profile preview --platform all

# Produzione (App Store / Play Store; .aab per Android)
eas build --profile production --platform all
```

EAS includerà automaticamente la cartella `firebase/` nel build context grazie a `.easignore` (sovrascrive `.gitignore` lato EAS). Le URL prod e `APP_VARIANT` sono settate come env nel relativo profilo di `eas.json`.

### Submit agli store

```bash
# iOS App Store / TestFlight
eas submit --profile production --platform ios

# Google Play Store (interno → produzione tramite console)
eas submit --profile production --platform android
```

### Backend richiesto

L'API e il WebSocket di prod sono già live:

- `https://norbo-api.mariustrica.com/docs` — REST (Swagger UI)
- `wss://dit-ws.mariustrica.com/ws` — WebSocket

Per dettagli operativi infra: `dit-infra/README.md`.

---

## Project structure

```
src/
  app/              # Expo Router screens (file-based routing)
    (auth)/         # Unauthenticated: login, OTP
    (tabs)/         # Tab navigator: dits, contacts, profile, settings
    dit/[userId]    # Dit detail screen
    contacts/       # Contact profile + add screens
    settings/       # Account, language screens
  components/       # Shared UI components
  constants/        # App-wide constants (layout, config)
  hooks/            # Business hooks (data fetching, WebSocket, auth)
  i18n/             # Internationalisation (i18next)
  services/         # API clients and WebSocket service
  stores/           # Zustand stores (auth, pings, contacts)
  theme/            # Unistyles tokens, dark/light themes
  types/            # Shared TypeScript types
  utils/            # Pure utilities (haptics, storage, ping utils)
```

---

## Authentication

The primary flow is **passwordless email OTP** (BetterAuth `emailOTP` plugin). Social login (Google, Facebook, Microsoft) is also supported via `expo-web-browser`.

Cold start sequence:

1. Restore user from MMKV → optimistic `isAuthed = true`
2. Validate via `GET /auth/me` → 401 clears auth and shows login
3. Fetch WS token via `POST /auth/ws-token` → stored in memory only
4. Connect WebSocket to dit-ping

The session cookie is handled automatically by axios (`withCredentials: true`). Never store or manage it manually.

---

## Real-time (WebSocket)

The WebSocket service (`src/services/websocket.service.ts`) is a typed event-emitter singleton. It:

- Sends `{ type: "auth", token }` immediately on connect
- Maintains a 30-second heartbeat
- Reconnects with exponential backoff (1s → 30s max) on disconnect

WebSocket events update **Zustand stores directly** — never React Query.

---

## Push notifications

FCM delivers data-only payloads to the device. Notifee handles local display and action buttons (Dah / Ignore). The `PING_ACTIONS` category is registered at app startup, before any notification can arrive.

Background handler (`messaging().setBackgroundMessageHandler` + `notifee.onBackgroundEvent`) is registered at module level, outside the React tree.

---

## Design system

- **Primary color:** toxic green — `#2EF080` (dark mode), `#00B84E` (light mode)
- **Fonts:** DM Mono (timestamps, handles, signals) + System UI (names, prose)
- **Pressables:** `DitPressable` only — wraps haptic feedback and spring animation
- **Animations:** `withSpring()` for all user-triggered motion; `withTiming()` only for progress/loading
- **Styling:** `createStyleSheet(theme => ...)` from react-native-unistyles — `StyleSheet.create()` is banned

---

## Windsurf context

Architecture decisions, coding standards, and library-specific patterns are documented in `.windsurf/rules/`. Additional context on API contracts lives in `.windsurf/context/`.

| File                                  | When to read                                                          |
| ------------------------------------- | --------------------------------------------------------------------- |
| `.windsurf/rules/architecture.md`     | Before touching navigation, stores, or the service layer              |
| `.windsurf/rules/coding-standards.md` | Before writing any new screen, component, or hook                     |
| `.windsurf/rules/decisions.md`        | Before proposing an alternative to an existing library/pattern choice |
| `.windsurf/rules/maintenance.md`      | Before editing any rule file                                          |
| `.windsurf/context/api-auth.md`       | Auth endpoint contracts (OTP, social, session, WS token)              |
| `.windsurf/context/social-auth.md`    | Social OAuth flow details and troubleshooting                         |

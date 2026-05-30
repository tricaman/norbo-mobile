# Deploy — norbo-mobile

Guida operativa per produrre una release di produzione.

Versione corrente: **1.3.1** (Android `versionCode` 4 / iOS `buildNumber` 6).

---

## 1. Pre-flight

- [ ] Tutto committato su `main`
- [ ] `pnpm install` aggiornato
- [ ] Backend prod (`norbo-api.mariustrica.com`, `norbo-ws.mariustrica.com`) raggiungibili
- [ ] `.env.prod` presente in root (vedi `.env.example` per la lista variabili)
- [ ] File Firebase prod presenti:
  - `firebase/prod/google-services.json`
  - `firebase/prod/GoogleService-Info.plist`
- [ ] Keystore upload Android disponibile e variabili in `~/.gradle/gradle.properties` o passate via `-P`:
  - `NORBO_UPLOAD_STORE_FILE`
  - `NORBO_UPLOAD_STORE_PASSWORD`
  - `NORBO_UPLOAD_KEY_ALIAS`
  - `NORBO_UPLOAD_KEY_PASSWORD`
  > Senza queste l'APK release viene firmato con la debug key (NON pubblicabile).

---

## 2. Bump versione

Modifica **`app.config.ts`**:

- `version` (semver visibile all'utente, sia iOS che Android)
- `ios.buildNumber` (string, **monotono crescente** per ogni upload TestFlight/App Store)
- `android.versionCode` (int, **monotono crescente** per ogni upload Play Store)

Sincronizza `android/app/build.gradle` (`versionCode` + `versionName`) con gli stessi valori, oppure rigenera con:

```bash
APP_VARIANT=production npx expo prebuild --platform android --no-install
```

> ⚠️ `expo prebuild` rigenera la cartella `android/`. Verifica che le custom plugin (`plugins/with*.js`) abbiano riapplicato tutto e che `android/app/google-services.json` sia quello prod (`diff android/app/google-services.json firebase/prod/google-services.json` → nessuna differenza).

Tag git consigliato a fine release:

```bash
git tag v1.2.1 && git push origin v1.2.1
```

---

## 3. Build Android (locale)

### APK (per distribuzione interna / sideload)

```bash
set -a && source .env.prod && set +a
cd android && ./gradlew assembleRelease
```

Output: `android/app/build/outputs/apk/release/norbo-<versionName>-<versionCode>-release.apk`

Es: `norbo-1.2.1-2-release.apk`.

Install su device collegato (`adb devices`):

```bash
adb install -r android/app/build/outputs/apk/release/norbo-1.2.1-2-release.apk
```

### AAB (per Google Play Console)

```bash
set -a && source .env.prod && set +a
cd android && ./gradlew bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab` → upload su Play Console.

---

## 4. Build iOS (locale, opzionale)

```bash
set -a && source .env.prod && set +a
APP_VARIANT=production npx expo run:ios --configuration Release
```

Per archive da inviare a TestFlight/App Store: aprire `ios/norbo.xcworkspace` in Xcode → scheme `norbo` → Product → Archive → Distribute App.

---

## 5. Build EAS (cloud, alternativa)

Profile `production` in `eas.json` ha già env e `APP_VARIANT=production` configurati.

```bash
eas build --profile production --platform android   # AAB
eas build --profile production --platform ios       # IPA
eas build --profile production --platform all
```

---

## 6. Verifica build

- [ ] L'app installata si chiama **norbo** (non "norbo (Dev)" né "norbo (Preview)")
- [ ] Bundle id: `app.mariustrica.norbo` (no suffisso `.dev` / `.preview`)
- [ ] Login funziona contro `norbo-api.mariustrica.com`
- [ ] WebSocket si connette a `norbo-ws.mariustrica.com/ws`
- [ ] Push notification arrivano (token FCM registrato sul progetto Firebase prod)

---

## 7. Submit

### Google Play

```bash
eas submit --platform android --latest   # se la build è EAS
```

oppure upload manuale dell'AAB su Play Console → Internal testing → promote.

### App Store

```bash
eas submit --platform ios --latest
```

oppure Xcode → Organizer → Distribute App → App Store Connect.

---

## 8. Post-deploy

- [ ] Tag git `v<version>` pushato
- [ ] Release notes su Play Console / App Store Connect
- [ ] Bump locale alla versione successiva (es. `1.2.2`, `versionCode` 3, `buildNumber` 5) per evitare collisioni alla prossima build

---

## Naming output

L'APK release viene rinominato automaticamente in `norbo-<versionName>-<versionCode>-release.apk`
grazie al blocco `applicationVariants.all` in `android/app/build.gradle`.
Ogni release ha quindi un nome **univoco** legato a `versionName + versionCode`.

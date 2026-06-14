# Deploy — norbo-mobile

Guida operativa per produrre una release di produzione.

Versione corrente: **1.5.1** (Android `versionCode` 8 / iOS `buildNumber` 1).

> 🔴 **Trappola CNG — leggi prima di tutto.** Le cartelle `android/` e `ios/` sono in
> `.gitignore` (Continuous Native Generation): vengono rigenerate da `expo prebuild` e
> riflettono l'**ultima variante** con cui sono state generate, di default `development`
> (bundle id con suffisso `.dev`, Firebase `firebase/dev/`). Una build di produzione lanciata
> senza prima rigenerare i native in variante `production` produce un bundle `.dev`
> **non pubblicabile**. Vedi **§2.1** — è obbligatorio.

---

## 1. Pre-flight

- [ ] Tutto committato su `main`
- [ ] `pnpm install` aggiornato
- [ ] Backend prod (`api.norbo.app`, `ws.norbo.app`) raggiungibili
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

`app.config.ts` è la **fonte di verità** per le versioni. Modifica lì:

- `version` (semver visibile all'utente, sia iOS che Android)
- `ios.buildNumber` (string, **monotono crescente** per ogni upload TestFlight/App Store)
- `android.versionCode` (int, **monotono crescente** per ogni upload Play Store)

> Non editare a mano `android/app/build.gradle` / `ios/*.pbxproj`: vengono **rigenerati** dal
> prebuild (§2.1) a partire da `app.config.ts`. Ogni modifica manuale ai native va persa.

### 2.1 Prebuild produzione — OBBLIGATORIO prima di ogni build prod

I native sono gitignored e di default in variante `development`. Rigenerali in `production`:

```bash
APP_VARIANT=production npx expo prebuild --platform android --clean --no-install
```

- `APP_VARIANT=production` → bundle id `app.mariustrica.norbo` (senza `.dev`), Firebase `firebase/prod/`, `versionCode`/`versionName` presi da `app.config.ts`. **Va passato esplicitamente sulla riga di comando**: expo carica `.env` da solo durante il prebuild, ma una var già esportata nell'env vince, quindi il prefisso `APP_VARIANT=production` ha la precedenza.
- `--clean` → cancella e rigenera `android/` da zero (evita residui della variante dev precedente).
- Le custom plugin (`plugins/with*.js`) vengono riapplicate automaticamente (notifiche, Notifee, firma release, cleartext, ecc.).

Verifica subito lo stato prod **prima** di buildare:

```bash
grep -E "namespace|applicationId|versionCode|versionName" android/app/build.gradle
#   → app.mariustrica.norbo (NO .dev), versionCode/versionName attesi
diff android/app/google-services.json firebase/prod/google-services.json
#   → nessun output = identico al prod
```

Tag git consigliato a fine release:

```bash
git tag v1.2.1 && git push origin v1.2.1
```

---

## 3. Build Android (locale)

> ✅ **Prerequisito:** aver eseguito **§2.1** (prebuild produzione). Senza, buildi un bundle `.dev`.
>
> `set -a && source .env.prod && set +a` esporta `APP_VARIANT=production` + gli URL prod
> (`api.norbo.app` / `ws.norbo.app`), che vengono **inlinati nel bundle JS** proprio in questo
> step. La firma release scatta automaticamente perché le 4 var `NORBO_UPLOAD_*` sono in
> `~/.gradle/gradle.properties` (se mancano → firma debug, **non pubblicabile**).
>
> Nota: `cd android && ./gradlew …` oppure, senza cambiare cartella, `./android/gradlew -p android …`.

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

Verifica la firma dell'AAB (deve essere la upload key, **non** `androiddebugkey`):

```bash
# estrai il certificato e controlla l'owner/alias
unzip -p android/app/build/outputs/bundle/release/app-release.aab META-INF/*.RSA \
  | keytool -printcert | grep -E "Owner|Alias|CN="
```

> Build lunga: per seguirla dal vivo redirigi su file e usa `tail -f`, es.
> `./android/gradlew -p android bundleRelease 2>&1 | tee /tmp/norbo-aab-build.log`
> poi in un altro terminale `tail -f /tmp/norbo-aab-build.log`.

---

## 4. Build iOS (locale, opzionale)

```bash
set -a && source .env.prod && set +a
APP_VARIANT=production npx expo run:ios --configuration Release
```

Per archive da inviare a TestFlight/App Store: aprire `ios/norbo.xcworkspace` in Xcode → scheme `norbo` → Product → Archive → Distribute App.

---

## 5. Build EAS (cloud, alternativa)

> ⚠️ **Al momento non utilizzabile con l'account loggato.** Il `projectId` in
> `app.config.ts` (`extra.eas.projectId`) restituisce `Entity not authorized` per l'utente
> corrente (`eas project:info` / `eas build:list` falliscono). Finché l'accesso al progetto EAS
> non viene sistemato, usa la **build locale (§2.1 + §3)**. Lo `eas submit` (§7) ha lo stesso problema.

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
- [ ] Login funziona contro `api.norbo.app`
- [ ] WebSocket si connette a `ws.norbo.app/ws`
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
- [ ] Bump locale alla versione successiva in `app.config.ts` (dopo la 1.5.1 → es. `version` `1.5.2`, `versionCode` 9, `buildNumber` 2) per evitare collisioni alla prossima build

---

## Naming output

L'APK release viene rinominato automaticamente in `norbo-<versionName>-<versionCode>-release.apk`
grazie al blocco `applicationVariants.all` in `android/app/build.gradle`.
Ogni release ha quindi un nome **univoco** legato a `versionName + versionCode`.

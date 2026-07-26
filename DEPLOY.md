# Deploy — norbo-mobile

Guida operativa per produrre una release di produzione.

> 🔴 **La prossima build DEVE incrementare le versioni rispetto a quelle già sullo store.**
> Questo file **non** riporta il numero dell'ultima release: la fonte di verità è lo **store**
> (Play Console → Internal testing / track attivo per Android; TestFlight/App Store Connect per
> iOS). Prima di ogni build **guarda lì** qual è l'ultimo `versionCode` / `buildNumber` caricato
> e incrementa a partire da quello in `app.config.ts`. Un nuovo AAB/IPA con lo stesso
> `versionCode` / `buildNumber` viene **rifiutato come duplicato** (build sprecata, ~16 min).
> Bumpa _prima_ di buildare — vedi **§2**, è il primo passo ed è obbligatorio.
>
> ⚠️ **Non fidarti dei valori correnti in `app.config.ts`**: potrebbero essere già stati
> caricati sullo store da una release precedente (il file può essere avanti rispetto a ciò che
> hai effettivamente pubblicato). Confronta **sempre** con lo store, non con il file.
>
> iOS non ancora in produzione (`buildNumber` lo gestiremo in futuro).

> 🔴 **Trappola CNG — leggi prima di tutto.** Le cartelle `android/` e `ios/` sono in
> `.gitignore` (Continuous Native Generation): vengono rigenerate da `expo prebuild` e
> riflettono l'**ultima variante** con cui sono state generate, di default `development`
> (bundle id con suffisso `.dev`, Firebase `firebase/dev/`). Una build di produzione lanciata
> senza prima rigenerare i native in variante `production` produce un bundle `.dev`
> **non pubblicabile**. Vedi **§2.1** — è obbligatorio.

---

## 1. Pre-flight

- [ ] **Versione incrementata** in `app.config.ts` rispetto all'ultima caricata sullo store (vedi §2) — **obbligatorio, primo passo**
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

## 2. Bump versione — OBBLIGATORIO, primo passo di ogni release

> 🔴 **Incrementa SEMPRE le versioni PRIMA di buildare, rispetto a quelle sullo store.**
> La fonte di verità di "cosa è già caricato" è lo **store**, non `app.config.ts`: il file può
> essere avanti (bump già committato ma mai pubblicato) o indietro. Un AAB/IPA con un
> `versionCode` / `buildNumber` **già presente sullo store** viene **rifiutato come duplicato**
> → build sprecata (~16 min). Il bump è il **primo** passo, **non** un'attività post-deploy.

**Prima di incrementare, controlla lo store** e prendi l'ultimo valore realmente caricato:

- Android → Play Console → track attivo (Internal testing / Production): ultimo `versionCode`.
- iOS → App Store Connect / TestFlight: ultimo `buildNumber` (quando gestiremo iOS).

Poi incrementa in `app.config.ts` (dove **scrivi** il nuovo valore; valori **monotoni crescenti**):

- `version` (semver visibile all'utente, sia iOS che Android)
- `android.versionCode` (int, **= ultimo `versionCode` sullo store + 1**) ← obbligatorio per la build Android
- `ios.buildNumber` (string, **= ultimo `buildNumber` sullo store + 1**) ← quando gestiremo iOS

> Es. se sullo store l'ultimo è `versionCode` 9 (`version` `1.5.2`) → in `app.config.ts` metti
> `version` `1.5.3`, `versionCode` 10 (e `buildNumber` se iOS). Se `app.config.ts` fosse già
> più avanti dello store, incrementa comunque **rispetto allo store**, non al file.

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
- [ ] Verifica che lo store mostri il `versionCode` / `buildNumber` appena caricato (diventa il nuovo riferimento per il prossimo bump)

> **Questo file non tiene traccia dell'ultima versione**: lo fa lo **store**, che è la fonte di
> verità. Il bump alla release successiva **non si fa qui**: si fa in **§2**, subito prima della
> prossima build, guardando l'ultimo valore sullo store ed incrementando quello. Così eviti di
> buildare su un `versionCode` già caricato senza dover mantenere un numero a mano in questo doc.

---

## Naming output

L'APK release viene rinominato automaticamente in `norbo-<versionName>-<versionCode>-release.apk`
grazie al blocco `applicationVariants.all` in `android/app/build.gradle`.
Ogni release ha quindi un nome **univoco** legato a `versionName + versionCode`.

# Deploy — norbo-mobile

Guida operativa per produrre una release (iOS TestFlight/App Store, Android Play Console).

---

## 0. Quadro generale — app, varianti, flusso

Ci sono **tre varianti** (controllate da `APP_VARIANT` in `app.config.ts`), ognuna con
bundle id e app store diversi:

| Variante       | `APP_VARIANT` | Bundle id                        | App su store                              | Uso                          |
| -------------- | ------------- | -------------------------------- | ----------------------------------------- | ---------------------------- |
| development    | `development` | `app.mariustrica.norbo.dev`      | —                                         | dev locale / dev client      |
| **preview (UAT)** | `preview`  | `app.mariustrica.norbo.preview`  | **norbo (UAT)** · App Store id `6794883790` | test interni su TestFlight    |
| **production** | `production`  | `app.mariustrica.norbo`          | **Norbo: animali e promemoria** · id `6794615057` | rilascio pubblico            |

Preview e production usano **entrambe** il backend prod (`api.norbo.app`) e Firebase prod.
Sono due **app Apple distinte**: un IPA `.preview` **non** è promuovibile all'app prod (bundle id
diverso, firma diversa). UAT è un ambiente di test parallelo, non uno stadio della stessa build.

### Flusso di rilascio consigliato

```
                    ┌─────────────────────────────────────────────┐
   sviluppo  ─────► │ 1. UAT: fastlane ios beta → TestFlight (UAT) │  test funzionali interni
                    └─────────────────────────────────────────────┘
                                        │  quando la UAT è OK
                                        ▼
                    ┌──────────────────────────────────────────────────────┐
   release   ─────► │ 2. PROD: fastlane ios prod → TestFlight (app prod)    │  stessa build che andrà live
                    └──────────────────────────────────────────────────────┘
                                        │  testi la build PROD in TestFlight
                                        ▼
                    ┌──────────────────────────────────────────────────────┐
   store     ─────► │ 3. Submit for Review della STESSA build su ASC        │  nessun rebuild tra test e store
                    └──────────────────────────────────────────────────────┘
```

> 🔵 **Punto chiave iOS.** L'app **prod** ha il suo canale TestFlight. Carichi lì l'IPA prod
> (`fastlane ios prod`), lo testi in TestFlight, e quando è tutto in regola fai **Submit for
> Review** di **quella stessa identica build** — nessuna nuova compilazione tra test e store.
> `fastlane ios prod` **carica ma NON manda in review** (`skip_submission`): il submit è un
> gesto manuale e deliberato su App Store Connect (vedi §7).

---

## ⚠️ Due trappole da conoscere prima di tutto

> 🔴 **Bump versione obbligatorio.** Ogni nuova build DEVE incrementare `buildNumber` (iOS) /
> `versionCode` (Android) rispetto all'**ultimo valore già sullo store per quella app**. La fonte
> di verità è lo **store**, non `app.config.ts` (il file può essere avanti o indietro). Una build
> con un numero già caricato viene **rifiutata come duplicato** → ~1h di build sprecata su iOS.
> Vedi **§2**. **UAT e prod hanno numerazioni indipendenti** (app diverse).

> 🔴 **Trappola CNG.** Le cartelle `android/` e `ios/` sono in `.gitignore` (Continuous Native
> Generation): le rigenera `expo prebuild` e riflettono l'**ultima variante** con cui sono state
> generate (default `development` = `.dev`). Buildare senza aver prima rigenerato i native nella
> variante giusta produce un bundle della variante sbagliata. Il prebuild nella variante corretta
> è **obbligatorio** prima di ogni build (§3.1 iOS, §4.1 Android).

---

## 1. Pre-flight

- [ ] **Versione/buildNumber incrementati** in `app.config.ts` rispetto all'ultimo sullo store (§2)
- [ ] Tutto committato su `main`
- [ ] `pnpm install` aggiornato
- [ ] Backend prod (`api.norbo.app`, `ws.norbo.app`) raggiungibili
- [ ] File Firebase prod presenti (usati sia da preview che da production):
  - `firebase/prod/google-services.json`
  - `firebase/prod/GoogleService-Info.plist`
- [ ] **iOS:** ASC API key presente (vedi §3.0)
- [ ] **Android:** keystore upload + variabili `NORBO_UPLOAD_*` in `~/.gradle/gradle.properties`
  (`NORBO_UPLOAD_STORE_FILE`, `_STORE_PASSWORD`, `_KEY_ALIAS`, `_KEY_PASSWORD`).
  > Senza queste l'APK/AAB release viene firmato con la debug key (**NON pubblicabile**).

---

## 2. Bump versione — primo passo di ogni release

> 🔴 Incrementa **PRIMA** di buildare, rispetto allo **store** (non al file).

**Controlla l'ultimo valore sullo store** per l'app che stai per buildare:

- iOS UAT   → App Store Connect → app "norbo (UAT)" → TestFlight → ultimo `buildNumber`.
- iOS PROD  → App Store Connect → app prod → TestFlight/App Store → ultimo `buildNumber`.
- Android   → Play Console → track attivo → ultimo `versionCode`.

Puoi leggerli anche via API (comodo, niente login web) — vedi §9.

Poi incrementa in `app.config.ts` (valori **monotoni crescenti**):

- `version` — semver visibile all'utente (iOS + Android)
- `ios.buildNumber` (string) — **= ultimo `buildNumber` sullo store di quell'app + 1**
- `android.versionCode` (int) — **= ultimo `versionCode` sullo store + 1**

> ⚠️ `buildNumber` iOS è **per-app**: UAT e prod hanno cronologie separate. Se UAT è al build 5 e
> prod è al build 2, per una nuova prod parti da 3, non da 6. Guarda sempre lo store dell'app target.

> Non editare a mano `android/app/build.gradle` / `ios/*.pbxproj`: vengono **rigenerati** dal
> prebuild a partire da `app.config.ts`.

---

## 3. iOS — build & upload su TestFlight (fastlane)

### 3.0 Prerequisiti iOS (una tantum)

- **fastlane** installato: `brew install fastlane` (isolato dal ruby di sistema 2.6).
- **ASC API key** in `fastlane/`:
  - `fastlane/AuthKey_279X5Y7X6H.p8` (la chiave privata, **gitignored**)
  - `fastlane/asc_api_key.json` (key_id / issuer_id / `key_filepath` → punta al .p8, **gitignored**)
- Certificato **Apple Distribution** + provisioning profile: **li crea fastlane** al primo run
  (`cert` + `sigh` via API key). Nessun setup manuale in Xcode.
- **Locale UTF-8 obbligatorio per TUTTA la sessione di build**, non solo per `pod install`:
  esporta `LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8` **una volta** e riusa quella shell fino
  all'upload. Su questa macchina il default è `LANG=""` / `LC_CTYPE="C"`, e ruby eredita
  `Encoding.default_external = US-ASCII`. Ne muoiono **due** tool distinti:
  - `pod install` → `Encoding::CompatibilityError` (CocoaPods 1.16 su ruby 4);
  - `fastlane ios beta|prod` → **xcpretty** va in `invalid byte sequence in US-ASCII
    (ArgumentError)` al primo byte non-ASCII emesso da xcodebuild (~10 s dopo l'inizio
    dell'archive). Siccome gym lancia la pipeline con `set -o pipefail`, l'esito è
    **fallimento anche se xcodebuild avrebbe compilato bene** — e te ne accorgi solo alla
    fine. Sintomo: log di gym congelato a un orario fisso mentre `fastlane` risulta ancora
    "vivo". Verifica rapida: `ruby -e 'puts Encoding.default_external'` → deve dire `UTF-8`.
- **Portachiavi sbloccato per `codesign`**, altrimenti la build si appende in silenzio.
  Durante `PhaseScriptExecution [CP] Embed Pods Frameworks` macOS può aprire un dialog
  **SecurityAgent** che chiede l'accesso alla chiave `Apple Distribution`: xcodebuild resta
  in attesa **senza timeout**, anche per ore. Costato 46 min il 2026-08-07.
  **Attenzione: il sintomo "log di gym congelato" è identico a quello UTF-8 qui sopra**, ma
  la causa è opposta. Si distinguono così:

  ```bash
  pgrep -fl "codesign|SecurityAgent"     # se compaiono entrambi → è il portachiavi
  ps -o etime=,%cpu= -p <pid-xcodebuild> # 0.0% CPU = attesa, non lentezza
  ```

  Sblocco immediato: clicca **"Consenti sempre"** sul dialog — la build **riprende dal punto
  esatto**, niente ricompilazione. Prevenzione una tantum (la password la digiti tu):

  ```bash
  security set-key-partition-list -S apple-tool:,apple:,codesign: -s \
    -k <password-del-login> ~/Library/Keychains/login.keychain-db
  ```

> EAS build/submit **non è utilizzabile**: il `projectId` in `app.config.ts` dà `Entity not
> authorized` per l'account corrente. Usiamo la build locale + fastlane descritta qui.

### 3.1 Prebuild iOS nella variante giusta — OBBLIGATORIO

```bash
# UAT / preview:
APP_VARIANT=preview npx expo prebuild --platform ios --clean --no-install
# PROD / production:
APP_VARIANT=production npx expo prebuild --platform ios --clean --no-install
```

Il nome del progetto Xcode dipende dalla variante:
`norboPreview.xcodeproj` (preview) oppure `norbo.xcodeproj` (production).

Poi installa i pod (crea il `.xcworkspace`):

```bash
cd ios && LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 pod install
```

Verifica lo stato **prima** di buildare:

```bash
# bundle id atteso (.preview per UAT, senza suffisso per prod):
grep "PRODUCT_BUNDLE_IDENTIFIER" ios/*.xcodeproj/project.pbxproj | grep -v Tests | sort -u
# nome app: "norbo (Preview)" (UAT) oppure "norbo" (prod)
/usr/libexec/PlistBuddy -c "Print :CFBundleDisplayName" ios/*/Info.plist
# buildNumber = quello bumpato in app.config.ts
/usr/libexec/PlistBuddy -c "Print :CFBundleVersion" ios/*/Info.plist
```

### 3.2 Build + upload

Esporta le var prod (vengono **inlinate nel bundle JS**: senza, l'app punterebbe a `localhost`
perché `.env` ha `APP_VARIANT=development` e URL locali), poi lancia il lane:

```bash
export APP_VARIANT=preview      # oppure production, coerente col prebuild di §3.1
export EXPO_PUBLIC_API_URL=https://api.norbo.app
export EXPO_PUBLIC_WS_URL=wss://ws.norbo.app/ws
export EXPO_PUBLIC_AUTH_CALLBACK_SCHEME=norbo

fastlane ios beta    # UAT  → app norbo (UAT),  bundle .preview
# oppure
fastlane ios prod    # PROD → app prod,          bundle .norbo
```

Il lane fa tutto: `cert` → `sigh` → firma manuale nel pbxproj → `build_app` → `upload_to_testflight`.

> ⏱️ La compilazione RN è lunga (**~55 min** su questa macchina: Skia, SVG, Reanimated, Firebase).
> È normale. L'upload vero e proprio dura ~1-2 min. `skip_waiting_for_build_processing: true`
> evita di restare appesi in attesa del processing lato Apple.

Output IPA: `build/norbo-preview.ipa` o `build/norbo-prod.ipa` (+ dSYM zip).

Entrambi i lane usano `skip_submission: true` → la build **compare in TestFlight** ma **non**
viene mandata in review.

### 3.3 Note di firma

- Il primo run crea **un** certificato Apple Distribution (limite Apple: 2-3 per account). Viene
  riusato per tutte le build successive, UAT e prod.
- Il provisioning profile è per-bundle: fastlane ne crea uno per `.preview` e uno per `.norbo`.
- Se cambi Mac o revochi il cert, `cert`+`sigh` li rigenerano al run successivo.

---

## 4. Android — build (locale) & upload su Play Console

### 4.1 Prebuild produzione — OBBLIGATORIO

```bash
APP_VARIANT=production npx expo prebuild --platform android --clean --no-install
```

Verifica:

```bash
grep -E "namespace|applicationId|versionCode|versionName" android/app/build.gradle
#   → app.mariustrica.norbo (NO .dev), versionCode/versionName attesi
diff android/app/google-services.json firebase/prod/google-services.json
#   → nessun output = identico al prod
```

### 4.2 Build AAB (per Play Console)

`set -a && source .env.prod && set +a` esporta `APP_VARIANT=production` + gli URL prod
(inlinati nel bundle JS). La firma release scatta se le 4 var `NORBO_UPLOAD_*` sono in
`~/.gradle/gradle.properties`.

```bash
set -a && source .env.prod && set +a
cd android && ./gradlew bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab` → upload su Play Console.

Verifica firma (deve essere la upload key, **non** `androiddebugkey`):

```bash
unzip -p android/app/build/outputs/bundle/release/app-release.aab META-INF/*.RSA \
  | keytool -printcert | grep -E "Owner|Alias|CN="
```

APK per sideload/test interno: `./gradlew assembleRelease` →
`android/app/build/outputs/apk/release/norbo-<versionName>-<versionCode>-release.apk`
(nome univoco grazie al blocco `applicationVariants.all` in `android/app/build.gradle`).

> Build lunga: `./android/gradlew -p android bundleRelease 2>&1 | tee /tmp/norbo-aab.log`
> e in un altro terminale `tail -f /tmp/norbo-aab.log`.

---

## 5. Verifica build

**iOS UAT** (app norbo UAT):
- [ ] App si chiama **norbo (Preview)**, bundle `app.mariustrica.norbo.preview`
- [ ] Punta a `api.norbo.app` / `ws.norbo.app` (non localhost)

**iOS PROD / Android prod:**
- [ ] App si chiama **norbo** (non "Dev"/"Preview"), bundle `app.mariustrica.norbo` (no suffisso)
- [ ] Login contro `api.norbo.app`, WebSocket `ws.norbo.app/ws`
- [ ] Push notification arrivano (token FCM su Firebase prod)

---

## 6. Test in TestFlight (UAT e PROD)

Dopo l'upload, la build passa in **Processing** lato Apple (~5-15 min) poi diventa **VALID**.

- **UAT:** App Store Connect → norbo (UAT) → TestFlight → aggiungi tester (interni o gruppo) →
  testa i flussi funzionali.
- **PROD:** stessa cosa sull'app prod. Qui stai testando **la build che andrà live**: valida
  tutto (login, notifiche, pagamenti, ecc.) su questa esatta build.

> Al primo test TestFlight ti chiederà le info **conformità export** (crittografia): di solito
> una risposta sì/no una tantum per build.

---

## 7. Submit in review (solo PROD, dopo il test)

Quando la build **prod** in TestFlight è validata:

**App Store Connect** → app prod → sezione **App Store** → seleziona **la stessa build** testata →
compila metadati/release notes → **Add for Review** / **Submit for Review**.

> È la **stessa identica build** già su TestFlight: nessun rebuild, nessun cambio di bit tra ciò
> che hai testato e ciò che va in review. Questo è il valore del flusso: testi ⇒ submitti l'uguale.

**Android:** Play Console → track (Internal/Closed testing → Production) → carica/promuovi l'AAB →
compila release notes → rollout.

> I metadati testuali dello store (descrizioni, keyword, **note di versione**) stanno in
> `fastlane/metadata/<locale>/` e si caricano con **`fastlane ios metadata`** (config in
> `fastlane/Deliverfile`, `skip_binary_upload`).
>
> ⚠️ **Non** usare `fastlane deliver` da CLI: fallirebbe con *"API key JSON is missing
> field(s): key"*. `Token.from_json_file` pretende il PEM **inline** nel campo `key` del
> JSON, mentre il nostro `asc_api_key.json` usa `key_filepath`. Il lane `ios metadata`
> aggira il problema passando `api_key:` con la stessa helper dei lane di build.
>
> ⚠️ `deliver` carica **tutti** i file presenti in `fastlane/metadata/`, non solo quelli
> che hai cambiato: se i file locali sono stale, sovrascrive descrizioni e keyword già
> pubblicate. Prima di lanciarlo verifica che locale e ASC coincidano.
>
> **Note di versione obbligatorie.** ASC rifiuta l'invio in review se `release_notes.txt`
> manca anche in una sola delle localizzazioni attive (oggi 16). L'errore in console
> elenca solo le prime lingue e sembra parziale: controlla sempre tutte.

---

## 8. Post-deploy

- [ ] Tag git: `git tag v<version> && git push origin v<version>`
- [ ] Release notes su App Store Connect / Play Console
- [ ] Verifica che lo store mostri il nuovo `buildNumber`/`versionCode` (nuovo riferimento per il
      prossimo bump)

> Questo file **non** tiene traccia dell'ultima versione: lo fa lo **store** (fonte di verità).
> Il prossimo bump si fa in §2 guardando lo store, non un numero mantenuto qui a mano.

---

## 9. Utility — leggere lo store via API (senza login web)

Utile per il bump (§2): l'ultimo buildNumber di ogni app, letto con l'ASC API key.

```bash
cd norbo-mobile
GEM_PATH=/usr/local/Cellar/fastlane/2.237.0/libexec /usr/local/bin/ruby -e '
require "spaceship"
key = Spaceship::ConnectAPI::Token.create(
  key_id:"279X5Y7X6H", issuer_id:"ce6e95bf-2366-4e78-abc5-cbb0162caba4",
  filepath: File.expand_path("fastlane/AuthKey_279X5Y7X6H.p8"))
Spaceship::ConnectAPI.token = key
{"UAT"=>"6794883790","PROD"=>"6794615057"}.each do |name,id|
  builds = Spaceship::ConnectAPI::Build.all(app_id: id, limit: 5)
  last = builds.map { |b| b.version.to_i }.max
  puts "#{name}: ultimo buildNumber = #{last || "(nessuna build)"}"
end
'
```

App id: **UAT** `6794883790` · **PROD** `6794615057` · Team `XFS75S4BYM`.

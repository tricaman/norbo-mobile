# Data Safety (Google Play) & App Privacy (App Store)

Fonte di verità per le dichiarazioni privacy dei due store. Congela **cosa** dichiariamo e
**perché**, con l'evidenza nel codice, così il modulo si ricompila senza rifare l'indagine.

> **Aggiornare questo file ogni volta che si aggiunge una dipendenza che tocca la rete,
> un campo persistito, o un endpoint che riceve dati dal device.** Una dichiarazione stale
> è esattamente ciò che ha causato il rigetto del versionCode 20.

Ultimo aggiornamento: **agosto 2026** — dopo il rigetto del versionCode 20.

---

## 1. Perché esiste questo documento

Google Play ha rigettato il **versionCode 20** con:

> *Invalid Data safety form — We detected user data transmitted off devices that you have not
> disclosed in your app's data safety form as user data collected.*
> *Policy Declaration - Data Safety Section: Device Or Other IDs Data Type*

Non era un bug dell'app: il modulo non dichiarava **Device or other IDs**, che l'app
trasmette davvero. Le tre fonti, tutte verificate dentro l'AAB spedito
(`android/app/build/outputs/bundle/release/app-release-20.aab`):

| Fonte | Cosa esce | Dove va |
|---|---|---|
| **Firebase Installations** (transitiva di `@react-native-firebase/messaging`) | **Firebase Installation ID (FID)** + "Firebase user agent" | Google (`firebaseinstallations.googleapis.com`) |
| **FCM registration token** | token push | Google **e** backend Norbo |
| **`deviceId`** | UUID per-installazione | backend Norbo |

Firebase documenta il FID come tipo **"Device or other IDs"** e precisa che la raccolta
**non è disattivabile** finché l'SDK è incluso
([firebase.google.com/docs/android/play-data-disclosure](https://firebase.google.com/docs/android/play-data-disclosure)).
Google elenca *"Firebase installation ID"* fra gli esempi di quel tipo di dato.

Nell'AAB sono presenti `firebase-measurement-connector.properties` e `client_analytics.proto`,
coerenti con quanto sopra.

**Advertising ID: assente.** Il manifest dentro l'AAB non contiene
`com.google.android.gms.permission.AD_ID`, e nel grafo Gradle non c'è nessuna libreria ads
(`play-services-ads-identifier`, `play-services-measurement` — entrambe fuori dal grafo).

---

## 2. Google Play — Data safety

Percorso: **Play Console → Policy and programs → App content → Data safety**.
È metadata: si modifica e si invia in review da **Publishing overview** *senza caricare un nuovo AAB*.

### 2.1 Data collection and security

| Domanda | Risposta | Motivo |
|---|---|---|
| Does your app collect or share any of the required user data types? | **Yes** | |
| Is all of the user data collected by your app encrypted in transit? | **Yes** | HTTPS/TLS ovunque: API, PUT presigned su R2, FCM |
| Do you provide a way for users to request that their data be deleted? | **Yes** | `DELETE /auth/me` — `norbo-api/src/modules/identity/interface/http/identity.controller.ts:130`, in-app come "Elimina account" |

### 2.2 Advertising ID (voce separata di App content)

**"No, my app does not use advertising ID."**

Verificabile in qualsiasi momento:

```bash
unzip -p android/app/build/outputs/bundle/release/app-release-*.aab \
  base/manifest/AndroidManifest.xml | strings | grep -i AD_ID   # → nessun risultato
```

### 2.3 Tipi di dato dichiarati

**Shared = No per tutti.** Firebase, Cloudflare R2 e Brevo sono *service provider* che
trattano per conto dello sviluppatore: Google esclude esplicitamente questi trasferimenti
dalla definizione di "sharing".

| Categoria → Tipo | Collected | Ephemeral | Req./Opt. | Purposes | Evidenza |
|---|---|---|---|---|---|
| **Device or other IDs** | Sì | No | Required | App functionality | FID (Firebase Installations); token FCM e `deviceId` UUID → `src/services/push-registration.ts:22-28,68-72`; persistiti in `PushToken`, `norbo-api/prisma/schema.prisma:458-471` |
| Personal info → Email address | Sì | No | Required | App functionality, Account management, Developer communications | `user.email` (`schema.prisma:92`); Brevo per OTP/verifica |
| Personal info → Name | Sì | No | Optional | App functionality, Account management | `user.name` (`schema.prisma:93`) |
| Personal info → User IDs | Sì | No | Required | App functionality, Account management | `user.id`; ID provider OAuth in tabella `account` (`schema.prisma:176-192`) |
| Personal info → Other info | Sì | No | Optional | App functionality | `Invite.email` (`schema.prisma:1153`); `PetBooklet.vetName/vetClinic/vetPhone` (`schema.prisma:317-319`) |
| Financial info → Other financial info | Sì | No | Optional | App functionality | `Expense.amount/currency/category` (`schema.prisma:571-594`). Nessun payment info, nessun IAP |
| Location → **Approximate location** | Sì | **Sì** | Optional | App functionality | Bounding box arrotondato verso `/places/nearby` e `/places/search`; **mai persistito** |
| Photos and videos → Photos | Sì | No | Optional | App functionality | `MediaAsset` → Cloudflare R2 (avatar, foto pet, album) |
| Files and docs → Files and docs | Sì | No | Optional | App functionality | Context `PET_DOCUMENT`, `EVENT_ATTACHMENT`, `EXPENSE_RECEIPT` (incl. PDF) |
| App activity → App interactions | Sì | No | Required | App functionality | `UserActivityDay`, `UserBadgeProgress` (streak/traguardi); inbox `Notification` |
| App activity → Other user-generated content | Sì | No | Optional | App functionality | Record pet ed eventi sanitari, `ToolResult.inputs`, `Report.subject/body`, `Place.submittedBy` |
| App info and performance → Diagnostics | Sì | No | Required | App functionality, Analytics | `GET /app/version?platform&version`; IP + User-Agent in `session` (`schema.prisma:168-169`); IP nei log pino (stdout, non DB) |

### 2.4 Tipi NON dichiarati, e perché

| Tipo | Motivo |
|---|---|
| **Health and fitness** | I dati sanitari sono dell'**animale**, non dell'utente. Google definisce Health info come *"information about your health"*. ⚠️ Unico punto con margine interpretativo: se un reviewer obietta, si aggiunge in appello. |
| **Contacts** | Nessun accesso alla rubrica di sistema. `Invite.email` è digitata a mano ed è coperta da *Personal info → Other info*. |
| **Precise location** | Non raccolta. L'unico vettore residuo erano i metadati EXIF delle foto: strippati sul device prima dell'upload (vedi §4). |
| Messages, Audio, Calendar, Web browsing | Assenti. |
| Payment info, Purchase history | L'app non ha acquisti in-app; `Subscription` non contiene dati di pagamento. |
| Installed apps, Race/ethnicity, orientamento, opinioni politiche/religiose | Assenti. |

**Nessun SDK di analytics o crash reporting.** `src/services/analytics.ts` è uno stub che fa
`console.log` solo sotto `__DEV__`; gli eventi sono droppati in produzione. Niente Sentry,
PostHog, Crashlytics, Firebase Analytics, Mixpanel, Amplitude, Branch, AppsFlyer, Adjust,
OneSignal, RevenueCat.

---

## 3. App Store — App Privacy (nutrition label)

Stesso inventario, tassonomia Apple. Percorso: **App Store Connect → App Privacy**.

`NSPrivacyTracking = false` e nessun SKAdNetwork: **"Data Not Used to Track You"**.
Tutto ciò che segue è **"Data Linked to You"** (legato all'account), salvo dove indicato.

| Categoria Apple | Tipo | Purpose | Linked | Tracking |
|---|---|---|---|---|
| Contact Info | Email Address | App Functionality | Sì | No |
| Contact Info | Name | App Functionality | Sì | No |
| Identifiers | User ID | App Functionality | Sì | No |
| Identifiers | Device ID | App Functionality | Sì | No |
| User Content | Photos or Videos | App Functionality | Sì | No |
| User Content | Other User Content | App Functionality | Sì | No |
| Financial Info | Other Financial Info | App Functionality | Sì | No |
| Location | Coarse Location | App Functionality | **No** | No |
| Usage Data | Product Interaction | App Functionality, Analytics | Sì | No |
| Diagnostics | Crash Data / Performance Data | App Functionality | Sì | No |

> **Coarse Location non è "linked"**: le coordinate non vengono mai associate all'account
> né persistite — servono solo a ordinare i risultati della mappa entro la singola richiesta.

Su iOS il geocoding usa `CLGeocoder` **locale** (`src/components/tools/places/geocode.ts:36`),
quindi la stringa d'indirizzo non lascia nemmeno il dispositivo.

### 3.1 `PrivacyInfo.xcprivacy`

`ios/PrivacyInfo.xcprivacy` è **generato dal prebuild** (CNG): `ios/` è gitignored, quindi
ogni modifica va fatta **via config plugin** in `plugins/`, mai a mano.

Stato attuale: `NSPrivacyCollectedDataTypes` è **vuoto**, incoerente con la tabella qui sopra.
Da popolare con un plugin dedicato — vedi §5.

---

## 4. Perché "Precise location" resta fuori: lo strip EXIF

Le foto vanno in **PUT diretto su R2** con presigned URL, quindi il backend non vede mai i
byte originali. Uno strip server-side non basterebbe: il GPS *sarebbe comunque stato
trasmesso*, e andrebbe dichiarato come raccolto. Per questo lo strip avviene **sul device**,
prima dell'upload.

Helper unico: **`src/utils/strip-exif.ts`**, attraversato da tutti i punti di upload.
Se aggiungi un nuovo punto di upload immagini, **fallo passare da lì**, altrimenti questa
dichiarazione smette di essere vera.

---

## 5. Igiene nota, non ancora risolta

- **`PrivacyInfo.xcprivacy`** con `NSPrivacyCollectedDataTypes` vuoto (§3.1).
- **Permessi Android iniettati dalle librerie e mai usati** nel manifest finale:
  `RECORD_AUDIO`, `SYSTEM_ALERT_WINDOW`, `USE_FINGERPRINT`,
  `READ_EXTERNAL_STORAGE` / `WRITE_EXTERNAL_STORAGE` → rimuovibili con `tools:node="remove"`.
  Permessi sensibili dichiarati e mai richiesti attirano scrutinio in review.
- **`react-native-device-info@10.3.0`** entra come transitiva di
  `sp-react-native-in-app-updates` ed è **autolinkata** (`PackageList.java`). Contiene codice
  nativo che legge `Settings.Secure.ANDROID_ID`, MAC address e serial number. Non viene mai
  chiamato dall'app (la lib usa solo `getVersion()`), e MAC/IMEI non sono comunque ottenibili
  a runtime perché mancano `ACCESS_WIFI_STATE` e `READ_PHONE_STATE` — ma **il codice è
  nell'APK** ed è rilevabile dall'analisi statica di Google. Rimuoverlo richiede di patchare
  o sostituire `sp-react-native-in-app-updates`.
- **`withAndroidCleartext.js`** forza `android:usesCleartextTraffic="true"` anche in release.
- **`expo-dev-client`** è in `dependencies` invece che `devDependencies`: finisce nella build
  di produzione e porta `NSLocalNetworkUsageDescription` + Bonjour `_expo._tcp` nel plist iOS.
- **Account deletion URL**: Play richiede, per le app con registrazione account, un **URL web**
  di richiesta cancellazione oltre al flusso in-app. Verificare che sia compilato in App content.

---

## 6. Comandi di verifica

```bash
# Permessi effettivi nell'AAB spedito
unzip -p android/app/build/outputs/bundle/release/app-release-*.aab \
  base/manifest/AndroidManifest.xml | strings | grep -i permission

# Advertising ID e Install Referrer (attesi: nessun risultato per AD_ID)
unzip -p android/app/build/outputs/bundle/release/app-release-*.aab \
  base/manifest/AndroidManifest.xml | strings | grep -iE "AD_ID|REFERRER"

# Chi tira dentro una dipendenza transitiva sospetta
npm ls react-native-device-info expo-application

# EXIF su un originale scaricato da R2 (atteso: nessun tag GPS)
exiftool -gps:all downloaded-original.jpg
```

---

## 7. Riferimenti

- [Play Console — Provide information for Google Play's Data safety section](https://support.google.com/googleplay/android-developer/answer/10787469)
- [Firebase — Privacy and data disclosure per SDK (Android)](https://firebase.google.com/docs/android/play-data-disclosure)
- Privacy policy pubblica: `norbo-frontend/i18n/messages/{it,en}.json`, chiave `privacy` →
  <https://www.norbo.app/it/privacy>. **Deve restare coerente con questo documento**: Google
  confronta il modulo con la policy durante la review.

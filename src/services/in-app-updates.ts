import { useAppUpdateStore } from "@/stores/app-update.store";
import { Linking, Platform } from "react-native";
import SpInAppUpdates, {
  IAUInstallStatus,
  IAUUpdateKind,
  type InstallationResult,
  type StatusUpdateEvent,
} from "sp-react-native-in-app-updates";

/**
 * Thin wrapper around `sp-react-native-in-app-updates` (Google Play Core).
 *
 * - Android: the update is downloaded and installed WITHOUT leaving the app.
 *   Optional updates use the FLEXIBLE flow (background download + our own
 *   progress bar + "restart now"); forced ones use IMMEDIATE (Play's own
 *   full-screen flow, which handles download, install and restart).
 * - iOS: Apple exposes no in-app update API, so there is nothing to do
 *   in-app — the CTA opens the App Store page.
 *
 * "Is there a newer version?" is NOT asked here for iOS: `GET /app/version`
 * already resolves it server-side (iTunes lookup + Play Developer API, cached
 * in Redis — see `useAppVersion`). Play Core is queried only on Android, and
 * only to answer a different question: can THIS device install the update
 * in-app right now? (false for sideloaded APKs — our `internal`/`preview`
 * builds — and during a staged rollout that hasn't reached the device.)
 *
 * Everything is FAIL-OPEN: if the native module isn't linked (older build
 * without the dependency) or Play misbehaves, calls degrade to "no in-app
 * update" and the flow falls back to the store page. Nothing ever throws at
 * the caller.
 */

let instance: SpInAppUpdates | null = null;

function getInstance(): SpInAppUpdates {
  if (!instance) instance = new SpInAppUpdates(__DEV__);
  return instance;
}

const IS_ANDROID = Platform.OS === "android";

/**
 * DEV ONLY: with `EXPO_PUBLIC_APP_UPDATE_DEV_LEVEL` set (see `useAppVersion`)
 * we fake the download, since no real store serves an update to a local build.
 */
const DEV_SIMULATE = __DEV__ && !!process.env.EXPO_PUBLIC_APP_UPDATE_DEV_LEVEL;

const setDownloadStatus = useAppUpdateStore.getState().setStatus;

/**
 * Android only: does Play have an update this device can install in-app?
 * Never throws — any failure means "no", and the caller falls back to the
 * store page.
 */
export async function checkPlayUpdate(currentVersion: string): Promise<boolean> {
  if (!IS_ANDROID) return false;
  try {
    const result = await getInstance().checkNeedsUpdate({
      curVersion: currentVersion,
    });
    return result.shouldUpdate;
  } catch {
    return false;
  }
}

interface StartUpdateOptions {
  /** True for the blocking gate (installed version below `minSupported`). */
  forced: boolean;
  /** True when Play Core can run the update in-app (`checkPlayUpdate`). */
  inApp: boolean;
  /** Store page, used on iOS and as the fallback when the Play flow can't run. */
  storeUrl: string | null;
}

/**
 * Runs the update. Android + `inApp` → native Play flow; anything else → the
 * store page. Never throws.
 */
export async function startStoreUpdate({
  forced,
  inApp,
  storeUrl,
}: StartUpdateOptions): Promise<void> {
  // Dev preview of the progress UI (no real Play involved).
  if (DEV_SIMULATE && !forced) {
    simulateDownloadProgress();
    return;
  }

  if (IS_ANDROID && inApp && (await startPlayFlow(forced))) return;

  // iOS, sideloaded builds, or a Play flow that refused to start: the store
  // page always works as an escape hatch.
  if (storeUrl) {
    try {
      await Linking.openURL(storeUrl);
      return;
    } catch {
      // fall through to the failed state below
    }
  }

  // Nothing left to try. The forced screen keeps its own retry button, so only
  // the optional card needs to be moved into the "failed" state.
  if (!forced) setDownloadStatus("failed");
}

/** Starts the native Play flow. Returns false when it couldn't be started. */
async function startPlayFlow(forced: boolean): Promise<boolean> {
  try {
    if (forced) {
      // IMMEDIATE draws Play's own full-screen UI and restarts the app itself:
      // no progress to publish, no "restart now" button on our side.
      await getInstance().startUpdate({ updateType: IAUUpdateKind.IMMEDIATE });
      return true;
    }
    setDownloadStatus("downloading", 0);
    getInstance().addStatusUpdateListener(onFlexibleStatus);
    getInstance().addIntentSelectionListener(onIntentResult);
    await getInstance().startUpdate({ updateType: IAUUpdateKind.FLEXIBLE });
    return true;
  } catch {
    detachAndroidListeners();
    setDownloadStatus("idle");
    return false;
  }
}

/**
 * Completes a downloaded FLEXIBLE update: restarts the app to install it.
 * Called by the "restart now" button.
 */
export function completeFlexibleUpdate(): void {
  setDownloadStatus("installing");
  if (DEV_SIMULATE) return;
  try {
    getInstance().installUpdate();
  } catch {
    setDownloadStatus("failed");
  }
}

/**
 * Removes the Android listeners of the FLEXIBLE flow.
 * Idempotent (the library dedupes by identity) and fail-open: safe to call
 * even when the native module isn't linked.
 */
function detachAndroidListeners(): void {
  try {
    getInstance().removeStatusUpdateListener(onFlexibleStatus);
  } catch {
    // no-op
  }
  try {
    getInstance().removeIntentSelectionListener(onIntentResult);
  } catch {
    // no-op
  }
}

/**
 * Result of Play's consent dialog (activity result).
 *
 * `startUpdate` resolves as soon as the dialog is LAUNCHED, not when the user
 * decides: if they cancel (or the flow fails outright) this event is the only
 * signal — the status listener emits nothing. Without handling it the card
 * would stay stuck on `downloading` at 0%, a phase in which it can't be
 * closed: the user could neither update nor get out.
 *
 * On FLEXIBLE, `INSTALLED` (RESULT_OK) only means "consent given, download
 * started": from there on `onFlexibleStatus` is in charge, so we ignore it.
 */
function onIntentResult(result: InstallationResult): void {
  // The native module emits the status as a string (e.g. "6"), not a number.
  if (Number(result) !== IAUInstallStatus.CANCELED) return;
  setDownloadStatus("failed");
  detachAndroidListeners();
}

function onFlexibleStatus(status: StatusUpdateEvent): void {
  switch (status.status) {
    case IAUInstallStatus.DOWNLOADING: {
      const total = Number(status.totalBytesToDownload) || 0;
      const done = Number(status.bytesDownloaded) || 0;
      setDownloadStatus("downloading", total > 0 ? done / total : 0);
      break;
    }
    case IAUInstallStatus.DOWNLOADED:
      setDownloadStatus("downloaded", 1);
      detachAndroidListeners();
      break;
    case IAUInstallStatus.INSTALLING:
      setDownloadStatus("installing");
      break;
    case IAUInstallStatus.FAILED:
    case IAUInstallStatus.CANCELED:
      setDownloadStatus("failed");
      detachAndroidListeners();
      break;
  }
}

/** Dev preview: walks the progress from 0 to 1, then lands on `downloaded`. */
function simulateDownloadProgress(): void {
  setDownloadStatus("downloading", 0);
  let progress = 0;
  const timer = setInterval(() => {
    progress += 0.1;
    if (progress >= 1) {
      clearInterval(timer);
      setDownloadStatus("downloaded", 1);
    } else {
      setDownloadStatus("downloading", progress);
    }
  }, 400);
}

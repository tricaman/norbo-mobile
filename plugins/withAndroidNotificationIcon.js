/**
 * Expo config plugin that:
 * 1. Copies the monochrome notification icon to the Android drawable directory.
 * 2. Injects FCM default_notification_icon and default_notification_color
 *    meta-data into AndroidManifest.xml so Firebase uses the correct icon
 *    for notifications received when the app is in background/killed.
 *
 * Source: assets/images/android-icon-monochrome.png
 * Destination: android/app/src/main/res/drawable/ic_notification.png
 *
 * Android requires a small icon (monochromatic, white on transparent) for
 * every notification. Without it, notifee throws:
 *   IllegalArgumentException: Invalid notification (no valid small icon)
 */
const {
  withDangerousMod,
  withAndroidManifest,
} = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

function withNotificationIcon(config) {
  return withDangerousMod(config, [
    "android",
    (config) => {
      const src = path.join(
        config.modRequest.projectRoot,
        "assets/images/android-icon-monochrome.png",
      );
      const drawableDir = path.join(
        config.modRequest.platformProjectRoot,
        "app/src/main/res/drawable",
      );
      const dest = path.join(drawableDir, "ic_notification.png");

      if (!fs.existsSync(drawableDir)) {
        fs.mkdirSync(drawableDir, { recursive: true });
      }

      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        console.log("✅ Copied ic_notification.png to Android drawable");
      } else {
        console.warn(`⚠️  android-icon-monochrome.png not found at ${src}`);
      }

      return config;
    },
  ]);
}

function withNotificationManifest(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;

    // Ensure tools namespace is declared
    if (!manifest.$) {
      manifest.$ = {};
    }
    if (!manifest.$["xmlns:tools"]) {
      manifest.$["xmlns:tools"] = "http://schemas.android.com/tools";
    }

    const mainApplication = manifest.application[0];

    if (!mainApplication["meta-data"]) {
      mainApplication["meta-data"] = [];
    }

    const metaData = mainApplication["meta-data"];

    const iconKey = "com.google.firebase.messaging.default_notification_icon";
    if (!metaData.some((m) => m.$?.["android:name"] === iconKey)) {
      metaData.push({
        $: {
          "android:name": iconKey,
          "android:resource": "@drawable/ic_notification",
        },
      });
      console.log(
        "✅ Added FCM default_notification_icon to AndroidManifest.xml",
      );
    }

    const colorKey = "com.google.firebase.messaging.default_notification_color";
    if (!metaData.some((m) => m.$?.["android:name"] === colorKey)) {
      metaData.push({
        $: {
          "android:name": colorKey,
          "android:resource": "@color/notification_color",
          "tools:replace": "android:resource",
        },
      });
      console.log(
        "✅ Added FCM default_notification_color to AndroidManifest.xml",
      );
    }

    return config;
  });
}

function withNotificationColor(config) {
  return withDangerousMod(config, [
    "android",
    (config) => {
      const valuesDir = path.join(
        config.modRequest.platformProjectRoot,
        "app/src/main/res/values",
      );
      const dest = path.join(valuesDir, "notification_colors.xml");

      if (!fs.existsSync(valuesDir)) {
        fs.mkdirSync(valuesDir, { recursive: true });
      }

      const xml = `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="notification_color">#2EF080</color>\n</resources>\n`;
      fs.writeFileSync(dest, xml, "utf8");
      console.log("✅ Written notification_colors.xml to Android res/values");

      return config;
    },
  ]);
}

module.exports = (config) => {
  config = withNotificationIcon(config);
  config = withNotificationColor(config);
  config = withNotificationManifest(config);
  return config;
};

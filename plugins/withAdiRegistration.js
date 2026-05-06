/**
 * Expo config plugin that writes `adi-registration.properties` into
 * `android/app/src/main/assets/` when the `ADI_REGISTRATION_TOKEN`
 * environment variable is set.
 *
 * This is required by Google Play Console's "Android developer verification"
 * flow to register a package name (one-time per package name per account).
 * Google provides a unique snippet and asks to ship it inside an APK's
 * assets folder, then upload a signed APK for fingerprint verification.
 *
 * Usage:
 *   ADI_REGISTRATION_TOKEN=CMUGP... npx eas-cli build --local \
 *     --platform android --profile internal --non-interactive
 *
 * When the env var is NOT set the plugin is a no-op, so it's safe to leave
 * wired up in `app.config.ts` permanently.
 */
const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

module.exports = function withAdiRegistration(config) {
  return withDangerousMod(config, [
    "android",
    (config) => {
      const token = process.env.ADI_REGISTRATION_TOKEN;
      if (!token) {
        return config;
      }

      const assetsDir = path.join(
        config.modRequest.platformProjectRoot,
        "app/src/main/assets",
      );
      const dest = path.join(assetsDir, "adi-registration.properties");

      if (!fs.existsSync(assetsDir)) {
        fs.mkdirSync(assetsDir, { recursive: true });
      }

      fs.writeFileSync(dest, token, "utf8");
      console.log(
        "✅ Written adi-registration.properties to Android assets (Play Console package name verification)",
      );

      return config;
    },
  ]);
};

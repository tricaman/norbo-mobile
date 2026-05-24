/**
 * Expo config plugin: configura il signing di release per Android.
 *
 * Credenziali lette da gradle properties (di solito in `~/.gradle/gradle.properties`,
 * MAI committate nel repo):
 *
 *   NORBO_UPLOAD_STORE_FILE=/Users/<you>/keys/norbo-upload.keystore
 *   NORBO_UPLOAD_STORE_PASSWORD=********
 *   NORBO_UPLOAD_KEY_ALIAS=norbo-upload
 *   NORBO_UPLOAD_KEY_PASSWORD=********
 *
 * Se le properties non sono presenti, la release ricade sul keystore di debug
 * (utile per build locali non destinate allo store).
 */
const { withAppBuildGradle } = require("expo/config-plugins");

const RELEASE_SIGNING_BLOCK = `
        release {
            if (project.hasProperty('NORBO_UPLOAD_STORE_FILE')) {
                storeFile file(NORBO_UPLOAD_STORE_FILE)
                storePassword NORBO_UPLOAD_STORE_PASSWORD
                keyAlias NORBO_UPLOAD_KEY_ALIAS
                keyPassword NORBO_UPLOAD_KEY_PASSWORD
            }
        }`;

module.exports = (config) => {
  return withAppBuildGradle(config, (cfg) => {
    let contents = cfg.modResults.contents;

    // 1. Inject release signingConfig (idempotent).
    if (!contents.includes("NORBO_UPLOAD_STORE_FILE")) {
      contents = contents.replace(
        /signingConfigs\s*\{\s*debug\s*\{[^}]*\}\s*\}/m,
        (match) => match.replace(/\}\s*\}$/, `}${RELEASE_SIGNING_BLOCK}\n    }`),
      );
    }

    // 2. Switch release buildType to use signingConfigs.release when keystore
    //    properties are provided; fallback to debug otherwise so dev builds
    //    keep working.
    contents = contents.replace(
      /release\s*\{\s*\/\/ Caution![^\n]*\n\s*\/\/ see https:\/\/reactnative\.dev[^\n]*\n\s*signingConfig signingConfigs\.debug/,
      `release {
            signingConfig project.hasProperty('NORBO_UPLOAD_STORE_FILE') ? signingConfigs.release : signingConfigs.debug`,
    );

    // Fallback: if the comment was already removed by a previous run, just
    // ensure the release buildType uses the conditional signingConfig.
    contents = contents.replace(
      /release\s*\{\s*signingConfig signingConfigs\.debug\b/,
      `release {
            signingConfig project.hasProperty('NORBO_UPLOAD_STORE_FILE') ? signingConfigs.release : signingConfigs.debug`,
    );

    cfg.modResults.contents = contents;
    return cfg;
  });
};

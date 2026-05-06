const { withAndroidManifest } = require("@expo/config-plugins");

module.exports = (config) => {
  return withAndroidManifest(config, (config) => {
    const app = config.modResults.manifest.application?.[0];
    if (!app) return config;

    app.$ = app.$ || {};
    app.$["android:usesCleartextTraffic"] = "true";

    return config;
  });
};

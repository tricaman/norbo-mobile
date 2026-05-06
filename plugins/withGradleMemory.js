/**
 * Expo config plugin: alza i limiti JVM di Gradle per evitare OOM / Metaspace
 * exhaustion durante i task `lintVitalAnalyze*` e `mergeReleaseJavaResource`
 * su progetti grandi (reanimated, skia, nitro, mmkv, ecc.).
 *
 * Sovrascrive `org.gradle.jvmargs` in `android/gradle.properties`.
 *
 * Default Expo 55: `-Xmx2048m -XX:MaxMetaspaceSize=512m` → troppo poco.
 * Nuovo valore:    `-Xmx6g   -XX:MaxMetaspaceSize=2g`.
 */
const { withGradleProperties } = require("expo/config-plugins");

const JVM_ARGS =
  "-Xmx6g -XX:MaxMetaspaceSize=2g -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8";

module.exports = (config) => {
  return withGradleProperties(config, (cfg) => {
    const key = "org.gradle.jvmargs";
    const existing = cfg.modResults.find(
      (item) => item.type === "property" && item.key === key,
    );
    if (existing) {
      existing.value = JVM_ARGS;
    } else {
      cfg.modResults.push({ type: "property", key, value: JVM_ARGS });
    }
    return cfg;
  });
};

const { withProjectBuildGradle } = require('@expo/config-plugins');

module.exports = (config) => {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      const contents = config.modResults.contents;
      if (!contents.includes('notifee')) {
        config.modResults.contents = contents.replace(
          /allprojects\s*\{[\s\S]*?repositories\s*\{/,
          (match) =>
            `${match}\n        maven { url("\$rootDir/../node_modules/@notifee/react-native/android/libs") }`
        );
        console.log('✅ Added Notifee Maven repository to build.gradle');
      }
    }
    return config;
  });
};

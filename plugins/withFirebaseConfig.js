const { withDangerousMod, withPlugins } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withFirebaseIOS = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const sourceFile = path.join(config.modRequest.projectRoot, 'ios', 'GoogleService-Info.plist');
      const targetDir = path.join(config.modRequest.platformProjectRoot, config.modRequest.projectName);
      const targetFile = path.join(targetDir, 'GoogleService-Info.plist');

      if (fs.existsSync(sourceFile)) {
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        fs.copyFileSync(sourceFile, targetFile);
        console.log('✅ Copied GoogleService-Info.plist to Xcode project');
      } else {
        console.warn('⚠️  GoogleService-Info.plist not found at:', sourceFile);
      }

      return config;
    },
  ]);
};

const withFirebaseAndroid = (config) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const sourceFile = path.join(config.modRequest.projectRoot, 'android', 'app', 'google-services.json');
      const targetFile = path.join(config.modRequest.platformProjectRoot, 'app', 'google-services.json');

      if (fs.existsSync(sourceFile)) {
        fs.copyFileSync(sourceFile, targetFile);
        console.log('✅ Copied google-services.json to Android project');
      } else {
        console.warn('⚠️  google-services.json not found at:', sourceFile);
      }

      return config;
    },
  ]);
};

module.exports = (config) => {
  return withPlugins(config, [withFirebaseIOS, withFirebaseAndroid]);
};

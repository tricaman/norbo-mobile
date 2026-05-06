const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      
      if (fs.existsSync(podfilePath)) {
        let podfileContent = fs.readFileSync(podfilePath, 'utf8');
        
        if (!podfileContent.includes('use_modular_headers!')) {
          podfileContent = podfileContent.replace(
            /platform :ios, podfile_properties\['ios\.deploymentTarget'\] \|\| '.*'/,
            (match) => `${match}\n  use_modular_headers!`
          );
          
          fs.writeFileSync(podfilePath, podfileContent);
          console.log('✅ Added use_modular_headers! to Podfile');
        }
      }
      
      return config;
    },
  ]);
};

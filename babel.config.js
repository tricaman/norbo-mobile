/** @type {import('react-native-unistyles/plugin').UnistylesPluginOptions} */
const unistylesPluginOptions = {
  // Any component in this folder gets processed for native theme updates.
  root: "src",
};

module.exports = {
  presets: ["babel-preset-expo"],
  plugins: [
    // MUST run before react-compiler (applied by babel-preset-expo when
    // experiments.reactCompiler is true) and before reanimated.
    ["react-native-unistyles/plugin", unistylesPluginOptions],
    "react-native-reanimated/plugin",
  ],
};

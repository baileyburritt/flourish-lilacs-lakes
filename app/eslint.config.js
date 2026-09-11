// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    // D2: focus indicators were previously stripped from primary inputs
    // with no replacement (see FocusRingStyle.tsx). This keeps that bug
    // from coming back one style object at a time.
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "Property[key.name='outline'][value.value='none']",
          message: "Do not strip focus outlines with outline: 'none' — use the shared FocusRingStyle component instead (see D2).",
        },
        {
          selector: "Property[key.name='outlineStyle'][value.value='none']",
          message: "Do not strip focus outlines with outlineStyle: 'none' — use the shared FocusRingStyle component instead (see D2).",
        },
      ],
    },
  },
]);

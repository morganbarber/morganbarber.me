import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import { baseConfig } from "./base.js";

/** Shared config for React component packages. */
export const reactInternalConfig = [
  ...baseConfig,
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    plugins: { react, "react-hooks": reactHooks },
    languageOptions: {
      globals: { ...globals.browser, React: "readonly", JSX: "readonly" },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: "detect" } },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,

      // The new JSX transform means React need not be in scope.
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",

      // Stale closures in effects are the most common source of the
      // "why did this fire twice" class of bug.
      "react-hooks/exhaustive-deps": "warn",

      // --- security-relevant ---

      // target="_blank" without rel="noopener" hands the opened page a
      // reference to this window.
      "react/jsx-no-target-blank": [
        "error",
        { allowReferrer: false, enforceDynamicLinks: "always" },
      ],

      // Flags dangerouslySetInnerHTML so every use is a deliberate exception
      // rather than something that slipped in.
      "react/no-danger": "warn",
      "react/no-danger-with-children": "error",

      "react/jsx-key": "error",
      "react/no-unescaped-entities": "off",
    },
  },
];

export default reactInternalConfig;

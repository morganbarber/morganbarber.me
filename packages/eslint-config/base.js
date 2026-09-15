import js from "@eslint/js";
import tseslint from "typescript-eslint";
import turbo from "eslint-plugin-turbo";
import prettier from "eslint-config-prettier";
import globals from "globals";

/**
 * Shared ESLint 9 flat config.
 *
 * Replaces the previous eslintrc-style configs, which were exported as CommonJS
 * objects with `extends`/`env`/`ignorePatterns` but consumed as flat config —
 * and which referenced `@vercel/style-guide`, a package that was never
 * installed. Lint could not run at all.
 *
 * The rules below are weighted toward correctness and the specific footguns
 * this codebase cares about, not style (Prettier owns style).
 */
export const baseConfig = [
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "**/.turbo/**",
      "**/coverage/**",
      "**/*.d.ts",
      "**/next-env.d.ts",
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,

  {
    plugins: { turbo },
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: { ...globals.node, ...globals.browser },
    },
    rules: {
      // Undeclared env vars are a deployment failure waiting to happen.
      "turbo/no-undeclared-env-vars": "warn",

      // `any` disables exactly the checking that makes the Supabase types
      // worth having. The original analytics action cast the client to `any`
      // and wrote a payload no type ever validated.
      "@typescript-eslint/no-explicit-any": "error",

      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_",
        },
      ],

      // Prefer explicit `import type` so type-only imports are erased and
      // cannot drag a server module into a client bundle.
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],

      // --- security-relevant ---

      // eval and friends.
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      "no-script-url": "error", // catches href="javascript:..."

      // Prototype pollution surface.
      "no-proto": "error",
      "no-extend-native": "error",

      // `==` against null/undefined hides type coercion bugs in validation code.
      eqeqeq: ["error", "always", { null: "ignore" }],

      "no-console": ["warn", { allow: ["warn", "error", "info"] }],
      "no-debugger": "error",
      "no-alert": "error",
      "prefer-const": "error",
      "no-var": "error",
      "object-shorthand": "warn",
    },
  },

  /*
    Test files assert against the exact payloads the production rules forbid —
    a URL-scheme test has to contain `javascript:` to prove it is rejected.
    Scoping the rule away here keeps it meaningful everywhere else rather than
    inviting a blanket disable comment in the source.
  */
  {
    files: ["**/*.test.{ts,tsx,js,mjs}", "**/*.spec.{ts,tsx,js,mjs}"],
    rules: {
      "no-script-url": "off",
      "no-console": "off",
      // Tests reach for internals deliberately.
      "@typescript-eslint/no-explicit-any": "off",
    },
  },

  // Config and script files are Node-only and may log freely.
  {
    files: ["**/*.config.{js,mjs,ts}", "**/scripts/**/*.{js,mjs}"],
    languageOptions: { globals: globals.node },
    rules: {
      "no-console": "off",
      "@typescript-eslint/no-require-imports": "off",
    },
  },
];

export default baseConfig;

import baseConfig from "@repo/eslint-config/base";

/**
 * Root-level files only (today: sst.config.ts).
 *
 * The pre-commit hook runs ESLint with `v10_config_lookup_from_file`, which
 * resolves the config nearest to each staged file. Workspaces have their own;
 * without this one, a staged root file made ESLint abort with "couldn't find an
 * eslint.config" and blocked every commit that touched it.
 */
/** @type {import("eslint").Linter.Config[]} */
export default [
  // Workspaces are linted by their own configs; .sst holds generated platform code.
  { ignores: ["apps/**", "packages/**", "tooling/**", ".sst/**"] },
  ...baseConfig,
  {
    // SST's ambient globals ($config, $app, $interpolate) are declared in a
    // generated .d.ts that can only be pulled in by reference, not imported.
    files: ["sst.config.ts"],
    rules: { "@typescript-eslint/triple-slash-reference": "off" },
  },
];

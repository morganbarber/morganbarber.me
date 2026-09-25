#!/usr/bin/env node
/**
 * Workspace dependency audit.
 *
 * npm hoists every workspace into the root node_modules, so a file can import
 * `@repo/ui` from an app that never declared it and everything still works —
 * until Turborepo schedules tasks from the declared graph, or the app is built
 * in isolation (as Vercel does), and it doesn't. This fails on any `@repo/*`
 * import that the importing workspace's package.json does not declare.
 *
 * Usage (from the repo root): npx check-deps
 * Needs no install — pure Node — so CI can run it before `npm ci`.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const rootPkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
const SOURCE = /\.(?:[cm]?[jt]sx?|css)$/;
const SKIP = new Set(["node_modules", ".next", ".turbo", "dist", "coverage", ".sst"]);
const IMPORT = /(?:from\s+|import\s*\(?\s*|require\s*\(\s*|@import\s+)["'](@repo\/[^/"']+)/g;

function* files(dir) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* files(path);
    else if (SOURCE.test(name)) yield path;
  }
}

const workspaces = rootPkg.workspaces
  .map((pattern) => pattern.replace(/\/\*$/, ""))
  .flatMap((parent) => readdirSync(join(ROOT, parent)).map((name) => join(ROOT, parent, name)))
  .filter((dir) => {
    try {
      return statSync(join(dir, "package.json")).isFile();
    } catch {
      return false;
    }
  });

const problems = [];
for (const dir of workspaces) {
  const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
  const declared = new Set([
    pkg.name,
    ...Object.keys(pkg.dependencies ?? {}),
    ...Object.keys(pkg.devDependencies ?? {}),
    ...Object.keys(pkg.peerDependencies ?? {}),
  ]);
  for (const file of files(dir)) {
    for (const [, name] of readFileSync(file, "utf8").matchAll(IMPORT)) {
      if (!declared.has(name)) {
        problems.push(`${relative(ROOT, file)}: imports ${name}, not declared by ${pkg.name}`);
      }
    }
  }
}

if (problems.length > 0) {
  console.error(`Undeclared workspace dependencies:\n  ${[...new Set(problems)].join("\n  ")}`);
  process.exit(1);
}
console.log(`✓ ${workspaces.length} workspaces declare every @repo/* package they import`);

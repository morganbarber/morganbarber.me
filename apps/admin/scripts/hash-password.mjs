#!/usr/bin/env node
/**
 * Generates an ADMIN_PASSWORD_HASH for the dashboard.
 *
 * NIST SP 800-63B §5.1.1.2 requires stored verifiers to be salted and hashed
 * with a memory-hard function. A plaintext password in a dotfile is exactly
 * what that guidance exists to prevent: it survives in backups, editor swap
 * files and shell history, and anyone who reads the file has the credential.
 *
 * Usage (run in a terminal):
 *   npm run admin:hash-password                # generates a strong password too
 *   npm run admin:hash-password -- --choose    # prompts for one you choose
 *
 * A chosen password is read from a hidden prompt, never from argv: a command-
 * line argument lands in shell history and the process list — the very
 * exposure this script exists to avoid.
 */

import { randomBytes, scrypt } from "node:crypto";
import { createInterface } from "node:readline";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

/*
  N=16384, r=8, p=1 is the widely used interactive-login baseline (~16 MB and
  ~100 ms). Raising N raises the cost for the attacker and for the one
  legitimate login per session, which is the trade a KDF exists to make.
*/
const PARAMS = { N: 16384, r: 8, p: 1 };
const KEY_LENGTH = 64;

/*
  The generated password is shown once, so it must only go to a person at a
  terminal — never into a file, pipe or CI log where it would persist.
*/
if (!process.stdin.isTTY || !process.stdout.isTTY) {
  console.error("Run this in an interactive terminal: it shows or asks for a password.");
  process.exit(1);
}

/** Reads a line without echoing it. */
async function promptHidden(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  const write = rl._writeToOutput.bind(rl);
  rl._writeToOutput = (text) => write(text.startsWith(question) ? text : "");
  try {
    return await new Promise((resolve) => rl.question(question, resolve));
  } finally {
    rl.close();
    process.stdout.write("\n");
  }
}

const choose = process.argv.includes("--choose");
if (process.argv.slice(2).some((arg) => arg !== "--choose")) {
  console.error("Passwords are not accepted as arguments (shell history). Use --choose.");
  process.exit(1);
}
const password = choose
  ? await promptHidden("New admin password: ")
  : randomBytes(18).toString("base64url");

if (password.length < 8) {
  console.error("Password must be at least 8 characters.");
  process.exit(1);
}

const salt = randomBytes(16);
const derived = await scryptAsync(password, salt, KEY_LENGTH, {
  ...PARAMS,
  maxmem: 256 * 1024 * 1024,
});

const encoded = [
  "scrypt",
  PARAMS.N,
  PARAMS.r,
  PARAMS.p,
  salt.toString("base64"),
  derived.toString("base64"),
].join("$");

console.log("\nAdd this to apps/admin/.env.local:\n");
console.log(`ADMIN_PASSWORD_HASH=${encoded}`);
console.log("\nThen REMOVE any ADMIN_PASSWORD line.\n");

if (!choose) {
  console.log("Your password (store it in a password manager — it is not recoverable):\n");
  console.log(`  ${password}\n`);
}

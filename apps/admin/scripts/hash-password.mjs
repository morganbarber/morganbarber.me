#!/usr/bin/env node
/**
 * Generates an ADMIN_PASSWORD_HASH for the dashboard.
 *
 * NIST SP 800-63B §5.1.1.2 requires stored verifiers to be salted and hashed
 * with a memory-hard function. A plaintext password in a dotfile is exactly
 * what that guidance exists to prevent: it survives in backups, editor swap
 * files and shell history, and anyone who reads the file has the credential.
 *
 * Usage:
 *   npm run admin:hash-password              # generates a strong password too
 *   npm run admin:hash-password -- "my pw"   # hashes one you chose
 */

import { randomBytes, scrypt } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

/*
  N=16384, r=8, p=1 is the widely used interactive-login baseline (~16 MB and
  ~100 ms). Raising N raises the cost for the attacker and for the one
  legitimate login per session, which is the trade a KDF exists to make.
*/
const PARAMS = { N: 16384, r: 8, p: 1 };
const KEY_LENGTH = 64;

const supplied = process.argv[2];
const password = supplied ?? randomBytes(18).toString("base64url");

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

if (!supplied) {
  console.log("Your password (store it in a password manager — it is not recoverable):\n");
  console.log(`  ${password}\n`);
}

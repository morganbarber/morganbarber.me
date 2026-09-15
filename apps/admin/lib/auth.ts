import "server-only";

import { cookies } from "next/headers";

/**
 * Session handling for the admin dashboard.
 *
 * The dashboard is local-only and already refuses to run on a hosting platform
 * (see `assertAdminRuntime`), so this password gate is defence in depth rather
 * than the primary control. It matters for the cases the runtime check cannot
 * cover: a shared machine, a forgotten `next dev` left running, a port
 * accidentally forwarded over SSH or a tunnel.
 *
 * Design notes:
 *
 *   • The session cookie holds `expiry.signature`, where the signature is an
 *     HMAC-SHA256 over the expiry using a server-side secret. Nothing sensitive
 *     is stored in the cookie and it cannot be forged without the secret.
 *   • Password and signature comparisons are constant-time. A plain `===`
 *     short-circuits on the first differing byte, which leaks the length of the
 *     matching prefix to anyone who can measure timing.
 *   • The cookie is httpOnly + sameSite=strict, so no page script can read it
 *     and no cross-site request can ride on it.
 */

const COOKIE_NAME = "admin_session";
const SESSION_DURATION_MS = 12 * 60 * 60 * 1000; // 12 hours

/**
 * The configured credential, in whichever form is available.
 *
 * `ADMIN_PASSWORD_HASH` is preferred: NIST SP 800-63B §5.1.1.2 requires stored
 * verifiers to be salted and hashed with a memory-hard function, so that a
 * leaked verifier cannot be turned back into the password. A plaintext
 * `ADMIN_PASSWORD` in a dotfile is exactly the artefact that guidance exists to
 * prevent — it survives in backups, editor swap files and shell history.
 *
 * Plaintext remains supported so an existing setup keeps working, but it warns
 * once and `npm run admin:hash-password` prints the replacement.
 */
function getCredential():
  | { kind: "scrypt"; salt: string; hash: string; params: ScryptParams }
  | { kind: "plaintext"; password: string } {
  const hashed = process.env.ADMIN_PASSWORD_HASH;

  if (hashed) {
    const parsed = parseScryptHash(hashed);
    if (!parsed) {
      throw new Error(
        "ADMIN_PASSWORD_HASH is malformed.\n\n" +
          "Expected: scrypt$N$r$p$<salt-base64>$<hash-base64>\n" +
          "Regenerate it with: npm run admin:hash-password",
      );
    }
    return parsed;
  }

  const password = process.env.ADMIN_PASSWORD;
  if (!password || password.length < 8) {
    throw new Error(
      "No admin credential is configured.\n\n" +
        "Set ADMIN_PASSWORD_HASH (preferred) or ADMIN_PASSWORD in apps/admin/.env.local.\n" +
        "  npm run admin:hash-password        # generates a password and its hash",
    );
  }

  if (!warnedAboutPlaintext) {
    warnedAboutPlaintext = true;
    console.warn(
      "[admin] Using a plaintext ADMIN_PASSWORD. Prefer ADMIN_PASSWORD_HASH so the " +
        "password is not stored in a file — run: npm run admin:hash-password",
    );
  }

  return { kind: "plaintext", password };
}

let warnedAboutPlaintext = false;

interface ScryptParams {
  N: number;
  r: number;
  p: number;
}

/** Parses `scrypt$N$r$p$salt$hash`. Returns null on anything unexpected. */
function parseScryptHash(
  value: string,
): { kind: "scrypt"; salt: string; hash: string; params: ScryptParams } | null {
  const parts = value.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return null;

  const [, rawN, rawR, rawP, salt, hash] = parts;
  const N = Number(rawN);
  const r = Number(rawR);
  const p = Number(rawP);

  // Bounded so a tampered value cannot turn a login into a memory bomb:
  // scrypt allocates roughly 128 * N * r bytes.
  if (!Number.isInteger(N) || N < 16384 || N > 1_048_576) return null;
  if (!Number.isInteger(r) || r < 1 || r > 32) return null;
  if (!Number.isInteger(p) || p < 1 || p > 16) return null;
  if (!salt || !hash) return null;

  return { kind: "scrypt", salt, hash, params: { N, r, p } };
}

/**
 * Secret used to sign session cookies.
 *
 * Falls back to deriving from ADMIN_PASSWORD so the dashboard works with one
 * variable configured. The consequence is that changing the password
 * invalidates existing sessions, which is the desired behaviour anyway.
 */
function getSigningSecret(): string {
  const explicit = process.env.ADMIN_SESSION_SECRET;
  if (explicit) return explicit;

  // Derive from whichever credential form is configured. With a hash that is
  // the stored verifier, which is stable and secret enough for this purpose;
  // with plaintext it is the password. Either way, changing the credential
  // invalidates existing sessions — the desired behaviour.
  const credential = getCredential();
  return credential.kind === "scrypt"
    ? `derived:${credential.hash}`
    : `derived:${credential.password}`;
}

/** True when the dashboard has enough configuration to authenticate anyone. */
export function isAuthConfigured(): boolean {
  try {
    getCredential();
    return true;
  } catch {
    return false;
  }
}

async function hmac(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return [...new Uint8Array(signature)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/** Constant-time string comparison. */
function timingSafeEqual(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const bufA = encoder.encode(a);
  const bufB = encoder.encode(b);

  // Fold the length difference into the result rather than returning early, so
  // unequal lengths take the same path as equal ones.
  let mismatch = bufA.length ^ bufB.length;
  const max = Math.max(bufA.length, bufB.length);
  for (let i = 0; i < max; i++) {
    mismatch |= (bufA[i] ?? 0) ^ (bufB[i] ?? 0);
  }
  return mismatch === 0;
}

export async function verifyPassword(candidate: string): Promise<boolean> {
  const credential = getCredential();

  if (credential.kind === "scrypt") {
    // scrypt is deliberately slow and memory-hard, so each guess costs the
    // attacker real resources — which is the entire point of a KDF and the
    // reason a plain hash would not do.
    const { scrypt: nodeScrypt, timingSafeEqual: nodeTimingSafeEqual } = await import(
      "node:crypto"
    );

    const salt = Buffer.from(credential.salt, "base64");
    const expected = Buffer.from(credential.hash, "base64");

    const derived = await new Promise<Buffer>((resolve, reject) => {
      nodeScrypt(
        candidate,
        salt,
        expected.length,
        {
          N: credential.params.N,
          r: credential.params.r,
          p: credential.params.p,
          // Node's default cap is below what N=16384,r=8 needs.
          maxmem: 256 * 1024 * 1024,
        },
        (error, key) => (error ? reject(error) : resolve(key as Buffer)),
      );
    });

    return (
      derived.length === expected.length && nodeTimingSafeEqual(derived, expected)
    );
  }

  // Plaintext fallback. Both sides are HMACed before comparison so the compare
  // runs over a fixed length regardless of how long the submitted value is.
  const secret = getSigningSecret();
  const [expected, actual] = await Promise.all([
    hmac(credential.password, secret),
    hmac(candidate, secret),
  ]);
  return timingSafeEqual(expected, actual);
}

export async function createSession(): Promise<void> {
  const expiry = String(Date.now() + SESSION_DURATION_MS);
  const signature = await hmac(expiry, getSigningSecret());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, `${expiry}.${signature}`, {
    httpOnly: true,
    sameSite: "strict",
    // The dashboard runs on http://127.0.0.1, where a Secure cookie would be
    // rejected outright and lock the user out of their own tool.
    secure: false,
    path: "/",
    maxAge: SESSION_DURATION_MS / 1000,
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Header that tells the browser to discard everything it cached for this
 * origin on sign-out.
 *
 * Deleting the cookie ends the session on the server, but the browser has
 * already cached rendered pages containing contact messages, analytics and
 * draft content. On a shared machine those stay in the back/forward cache and
 * the HTTP cache after logout. `Clear-Site-Data` removes them.
 */
export const CLEAR_SITE_DATA = '"cache", "cookies", "storage"';

export async function isAuthenticated(): Promise<boolean> {
  if (!isAuthConfigured()) return false;

  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  if (!raw) return false;

  const [expiry, signature] = raw.split(".");
  if (!expiry || !signature) return false;

  const expiresAt = Number(expiry);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false;

  const expected = await hmac(expiry, getSigningSecret());
  return timingSafeEqual(expected, signature);
}

/**
 * Cryptographic primitives shared across the monorepo.
 *
 * Web Crypto and standard globals only, so every function works unchanged on
 * the Node and Edge runtimes. These previously existed in three places — the
 * rate-limit module, the admin session code and the request helpers — each a
 * slightly different copy, which is exactly how one of them ends up subtly
 * wrong. There is now one implementation, and it is tested.
 */

const encoder = new TextEncoder();

/** Lowercase hex encoding of raw bytes. */
export function toHex(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let out = "";
  for (const byte of view) out += byte.toString(16).padStart(2, "0");
  return out;
}

/** SHA-256 of a UTF-8 string, as lowercase hex. */
export async function sha256Hex(input: string): Promise<string> {
  return toHex(await crypto.subtle.digest("SHA-256", encoder.encode(input)));
}

/** HMAC-SHA256 of `message` under `secret`, as lowercase hex. */
export async function hmacSha256Hex(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return toHex(await crypto.subtle.sign("HMAC", key, encoder.encode(message)));
}

/**
 * Constant-time string comparison.
 *
 * A plain `===` short-circuits on the first differing byte, which leaks the
 * length of the matching prefix to anyone able to time the response. The
 * length difference is folded into the result rather than returned early, so
 * unequal lengths take the same path as equal ones.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  const bufA = encoder.encode(a);
  const bufB = encoder.encode(b);

  let mismatch = bufA.length ^ bufB.length;
  const max = Math.max(bufA.length, bufB.length);
  for (let i = 0; i < max; i++) {
    mismatch |= (bufA[i] ?? 0) ^ (bufB[i] ?? 0);
  }
  return mismatch === 0;
}

/** Cryptographically random bytes as base64 — e.g. a CSP nonce. */
export function randomBase64(byteLength = 16): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

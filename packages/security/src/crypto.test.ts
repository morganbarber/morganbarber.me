import assert from "node:assert/strict";
import { createHash, createHmac } from "node:crypto";
import { describe, it } from "node:test";

import { hmacSha256Hex, randomBase64, sha256Hex, timingSafeEqual, toHex } from "./crypto.ts";

/**
 * The Web Crypto implementations are checked against Node's own `crypto`
 * module, an independent implementation, rather than against hard-coded
 * vectors that could share a mistake with the code under test.
 */

describe("sha256Hex", () => {
  it("matches node:crypto", async () => {
    for (const input of ["", "abc", "salt:203.0.113.9", "unicode ✓ café"]) {
      assert.equal(await sha256Hex(input), createHash("sha256").update(input).digest("hex"));
    }
  });
});

describe("hmacSha256Hex", () => {
  it("matches node:crypto", async () => {
    const expected = createHmac("sha256", "secret").update("message").digest("hex");
    assert.equal(await hmacSha256Hex("message", "secret"), expected);
  });

  it("depends on the secret", async () => {
    assert.notEqual(await hmacSha256Hex("m", "a"), await hmacSha256Hex("m", "b"));
  });
});

describe("timingSafeEqual", () => {
  it("is true only for identical strings", () => {
    assert.equal(timingSafeEqual("abc", "abc"), true);
    assert.equal(timingSafeEqual("abc", "abd"), false);
    assert.equal(timingSafeEqual("", ""), true);
  });

  it("is false when one string is a prefix of the other", () => {
    // The classic bug in hand-rolled comparisons: comparing only up to the
    // shorter length reports a prefix as equal.
    assert.equal(timingSafeEqual("secret", "secret-and-more"), false);
    assert.equal(timingSafeEqual("secret-and-more", "secret"), false);
    assert.equal(timingSafeEqual("", "x"), false);
  });

  it("compares multi-byte characters by their encoded bytes", () => {
    assert.equal(timingSafeEqual("café", "café"), true);
    assert.equal(timingSafeEqual("café", "cafe"), false);
  });
});

describe("randomBase64", () => {
  it("returns the requested entropy, base64-encoded", () => {
    const value = randomBase64(16);
    assert.equal(Buffer.from(value, "base64").length, 16);
  });

  it("does not repeat", () => {
    const seen = new Set(Array.from({ length: 200 }, () => randomBase64(16)));
    assert.equal(seen.size, 200);
  });
});

describe("toHex", () => {
  it("zero-pads each byte", () => {
    assert.equal(toHex(new Uint8Array([0, 1, 15, 16, 255])), "00010f10ff");
  });
});

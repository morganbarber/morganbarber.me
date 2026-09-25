import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isSecretKey, isServiceRoleJwt } from "./env.ts";

/**
 * The guard that stops a privileged Supabase key being placed in a
 * NEXT_PUBLIC_* variable, where it would be compiled into every visitor's
 * JavaScript. Tested with structurally real (unsigned) JWTs.
 */

function jwt(payload: Record<string, unknown>): string {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encode({ alg: "HS256", typ: "JWT" })}.${encode(payload)}.signature`;
}

describe("isServiceRoleJwt", () => {
  it("detects a service-role JWT", () => {
    assert.equal(isServiceRoleJwt(jwt({ role: "service_role", ref: "abc" })), true);
  });

  it("does not flag an anon JWT", () => {
    assert.equal(isServiceRoleJwt(jwt({ role: "anon", ref: "abc" })), false);
  });

  it("handles non-JWT and malformed input without throwing", () => {
    for (const value of ["", "sb_publishable_abc", "a.b", "a.!!!.c", "x.y.z"]) {
      assert.equal(isServiceRoleJwt(value), false, value);
    }
  });
});

describe("isSecretKey", () => {
  it("flags both generations of secret key", () => {
    assert.equal(isSecretKey("sb_secret_0123456789abcdef"), true);
    assert.equal(isSecretKey(jwt({ role: "service_role" })), true);
  });

  it("allows publishable and anon keys", () => {
    assert.equal(isSecretKey("sb_publishable_0123456789abcdef"), false);
    assert.equal(isSecretKey(jwt({ role: "anon" })), false);
  });
});

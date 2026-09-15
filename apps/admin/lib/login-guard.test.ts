import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";

import {
  checkLoginAllowed,
  recordFailure,
  recordSuccess,
  __resetLoginGuard,
} from "./login-guard.ts";

/**
 * Tests for the admin login brute-force guard.
 *
 * Uses the Node built-in test runner, so there is no test framework to install
 * or keep current — for a handful of pure-logic tests that is the right trade.
 *
 * Run with: npm run test --workspace @repo/admin
 */

describe("login guard", () => {
  const SOURCE = "203.0.113.9";

  beforeEach(() => {
    __resetLoginGuard();
  });

  it("allows a source that has never failed", () => {
    const state = checkLoginAllowed(SOURCE);
    assert.equal(state.allowed, true);
    assert.equal(state.remaining, 5);
  });

  it("allows attempts up to the threshold", () => {
    for (let i = 0; i < 4; i++) recordFailure(SOURCE);

    const state = checkLoginAllowed(SOURCE);
    assert.equal(state.allowed, true, "4 failures should not lock out");
    assert.equal(state.remaining, 1);
  });

  it("locks out on the fifth failure", () => {
    for (let i = 0; i < 4; i++) recordFailure(SOURCE);
    const state = recordFailure(SOURCE);

    assert.equal(state.allowed, false);
    assert.ok(state.retryAfter > 25 && state.retryAfter <= 30, "~30s first lockout");
    assert.equal(checkLoginAllowed(SOURCE).allowed, false);
  });

  /**
   * The property the previous implementation lacked.
   *
   * It defended with a fixed 600 ms delay per request, which is per-request by
   * definition — twenty concurrent requests got twenty guesses per 600 ms. A
   * shared counter is what makes the limit real.
   */
  it("refuses parallel attempts once locked out", () => {
    for (let i = 0; i < 5; i++) recordFailure(SOURCE);

    const results = Array.from({ length: 20 }, () => checkLoginAllowed(SOURCE).allowed);
    assert.ok(
      results.every((allowed) => allowed === false),
      "every concurrent attempt must be refused, not just the first",
    );
  });

  it("escalates the lockout as failures continue", () => {
    for (let i = 0; i < 5; i++) recordFailure(SOURCE);

    const second = recordFailure(SOURCE);
    assert.ok(second.retryAfter > 110 && second.retryAfter <= 120, "~2 minutes");

    const third = recordFailure(SOURCE);
    assert.ok(third.retryAfter > 590 && third.retryAfter <= 600, "~10 minutes");
  });

  it("isolates sources from each other", () => {
    for (let i = 0; i < 6; i++) recordFailure(SOURCE);

    assert.equal(checkLoginAllowed(SOURCE).allowed, false);
    assert.equal(checkLoginAllowed("198.51.100.4").allowed, true);
  });

  /**
   * Without this, an operator who mistyped four times would spend the rest of
   * the hour one failure from a lockout.
   */
  it("clears the counter after a successful login", () => {
    for (let i = 0; i < 4; i++) recordFailure(SOURCE);
    recordSuccess(SOURCE);

    const state = checkLoginAllowed(SOURCE);
    assert.equal(state.allowed, true);
    assert.equal(state.remaining, 5);
  });
});

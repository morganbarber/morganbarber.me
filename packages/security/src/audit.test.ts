import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { redact } from "./audit.ts";

/**
 * Tests for log-injection defence (CWE-117, OWASP A03:2021).
 *
 * Every value reaching a log line here is attacker-controlled — a CSP report's
 * `blocked-uri`, a requested path, an Origin header. Without sanitisation a
 * newline forges a log entry and an ANSI escape rewrites a terminal, which
 * turns the audit trail into something an attacker can edit.
 */

describe("redact", () => {
  const LF = String.fromCharCode(10);
  const CR = String.fromCharCode(13);
  const ESC = String.fromCharCode(27);
  const NUL = String.fromCharCode(0);

  it("strips newlines that would forge a second log entry", () => {
    const forged = `https://evil/x.js${LF}[security] {"event":"auth.success"}`;
    const out = redact(forged);

    assert.ok(!out.includes(LF), "no line feed may survive");
    assert.ok(!out.includes(CR), "no carriage return may survive");
  });

  it("strips ANSI escape sequences", () => {
    const out = redact(`red${ESC}[31mtext`);
    assert.ok(!out.includes(ESC), "escape introducer must be removed");
  });

  it("strips NUL and other C0 controls", () => {
    const out = redact(`before${NUL}after`);
    assert.ok(!out.includes(NUL));
  });

  it("truncates to the requested length", () => {
    const out = redact("x".repeat(500), 50);
    // 50 characters plus the ellipsis marker.
    assert.ok(out.length <= 51, `got ${out.length}`);
    assert.ok(out.endsWith("…"));
  });

  it("preserves ordinary text unchanged", () => {
    assert.equal(redact("/api/analytics"), "/api/analytics");
    assert.equal(redact("https://example.com/a?b=c"), "https://example.com/a?b=c");
  });

  it("handles non-string input without throwing", () => {
    assert.equal(redact(42), "42");
    assert.equal(redact(true), "true");
    assert.equal(redact(null), "");
    assert.equal(redact(undefined), "");
    assert.equal(redact({ a: 1 }), '{"a":1}');
  });

  it("keeps non-ASCII text, which is legitimate content", () => {
    assert.equal(redact("café — naïve"), "café — naïve");
  });
});

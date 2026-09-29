import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isSafeExternalUrl, isSafeInternalPath, isUrlOnHost, safeHref } from "./url.ts";

/**
 * Tests for URL scheme validation (OWASP A03:2021 — Injection).
 *
 * React escapes text content but does NOT validate URL schemes, so
 * `<a href={row.link}>` will happily execute `javascript:`. These helpers are
 * the control; the database CHECK constraints are the second layer.
 */

describe("isSafeExternalUrl", () => {
  it("accepts http and https", () => {
    assert.equal(isSafeExternalUrl("https://github.com/x"), true);
    assert.equal(isSafeExternalUrl("http://example.com"), true);
  });

  it("accepts mailto", () => {
    assert.equal(isSafeExternalUrl("mailto:someone@example.com"), true);
  });

  it("rejects javascript:, the actual XSS vector", () => {
    assert.equal(isSafeExternalUrl("javascript:alert(1)"), false);
    // Case and whitespace variants browsers still execute.
    assert.equal(isSafeExternalUrl("JaVaScRiPt:alert(1)"), false);
    assert.equal(isSafeExternalUrl("  javascript:alert(1)"), false);
  });

  it("rejects data: and vbscript:", () => {
    assert.equal(isSafeExternalUrl("data:text/html,<script>alert(1)</script>"), false);
    assert.equal(isSafeExternalUrl("vbscript:msgbox(1)"), false);
  });

  it("rejects file: and other local schemes", () => {
    assert.equal(isSafeExternalUrl("file:///etc/passwd"), false);
  });

  it("rejects empty and malformed input", () => {
    assert.equal(isSafeExternalUrl(""), false);
    assert.equal(isSafeExternalUrl(null), false);
    assert.equal(isSafeExternalUrl(undefined), false);
    assert.equal(isSafeExternalUrl("not a url"), false);
  });
});

describe("isSafeInternalPath", () => {
  it("accepts site-relative paths", () => {
    assert.equal(isSafeInternalPath("/blog/post"), true);
    assert.equal(isSafeInternalPath("/"), true);
  });

  /**
   * The subtle one: browsers treat `//host` as protocol-relative, so it
   * navigates off-site while looking like a local path.
   */
  it("rejects protocol-relative URLs", () => {
    assert.equal(isSafeInternalPath("//evil.example/x"), false);
  });

  it("rejects absolute URLs and bare paths", () => {
    assert.equal(isSafeInternalPath("https://evil.example"), false);
    assert.equal(isSafeInternalPath("blog/post"), false);
  });
});

describe("safeHref", () => {
  it("passes through both safe forms", () => {
    assert.equal(safeHref("/about"), "/about");
    assert.equal(safeHref("https://example.com"), "https://example.com");
  });

  it("returns null for anything unsafe, so the caller omits the link", () => {
    assert.equal(safeHref("javascript:alert(1)"), null);
    assert.equal(safeHref("//evil.example"), null);
    assert.equal(safeHref(null), null);
  });
});

describe("isUrlOnHost", () => {
  const hosts = ["github.com", "gitlab.com"];

  it("accepts the listed hosts, with or without www", () => {
    assert.equal(isUrlOnHost("https://github.com/morganbarber/psti.io", hosts), true);
    assert.equal(isUrlOnHost("https://www.GitHub.com/x", hosts), true);
    assert.equal(isUrlOnHost("http://gitlab.com/x", hosts), true);
  });

  it("rejects hosts that merely contain a listed name", () => {
    for (const url of [
      "https://evil.example/github.com",
      "https://github.com.evil.example/x",
      "https://notgithub.com/x",
      "https://evil.example/?next=https://github.com",
    ]) {
      assert.equal(isUrlOnHost(url, hosts), false, url);
    }
  });

  it("rejects non-http schemes and empty input", () => {
    assert.equal(isUrlOnHost("javascript://github.com/%0aalert(1)", hosts), false);
    assert.equal(isUrlOnHost(null, hosts), false);
    assert.equal(isUrlOnHost("", hosts), false);
  });
});

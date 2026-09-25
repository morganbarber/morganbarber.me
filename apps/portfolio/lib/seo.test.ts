import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { clampDescription, readableTitle } from "./seo.ts";

describe("readableTitle", () => {
  it("title-cases an all-caps title, keeping acronyms and small words right", () => {
    assert.equal(
      readableTitle("ADVANCED PERSISTENT THREATS IN INDUSTRIAL IoT"),
      "Advanced Persistent Threats in Industrial IoT",
    );
    assert.equal(
      readableTitle("ZERO TRUST ARCHITECTURE: IMPLEMENTATION STRATEGIES"),
      "Zero Trust Architecture: Implementation Strategies",
    );
    assert.equal(
      readableTitle("AUTOMATING THREAT INTELLIGENCE WITH PYTHON"),
      "Automating Threat Intelligence with Python",
    );
  });

  it("capitalises a small word that starts the title or follows a colon", () => {
    assert.equal(readableTitle("THE CASE FOR XSS: A PRIMER"), "The Case for XSS: A Primer");
  });

  it("leaves mixed-case titles exactly as the author wrote them", () => {
    assert.equal(readableTitle("Building a NIDS with Scapy"), "Building a NIDS with Scapy");
  });
});

describe("clampDescription", () => {
  it("leaves short text alone", () => {
    assert.equal(clampDescription("Short."), "Short.");
  });

  it("cuts long text at a word boundary within the snippet limit", () => {
    const out = clampDescription("word ".repeat(80));
    assert.ok(out.length <= 158, `length ${out.length}`);
    assert.ok(out.endsWith("…"));
    assert.ok(!out.includes("wor…"), "must not cut mid-word");
  });
});

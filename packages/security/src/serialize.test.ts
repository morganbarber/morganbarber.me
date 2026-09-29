import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { jsonForScript } from "./serialize.ts";

describe("jsonForScript", () => {
  it("cannot close the surrounding script element", () => {
    const out = jsonForScript({ title: "</script><script>alert(1)</script>" });
    assert.doesNotMatch(out, /<\/script/i);
    assert.doesNotMatch(out, /[<>]/);
  });

  it("round-trips to the same value", () => {
    const value = { a: "<b>&amp;</b>", line: "x\u2028y\u2029z", n: 1, list: [true, null] };
    assert.deepEqual(JSON.parse(jsonForScript(value)), value);
  });

  it("escapes the JS line terminators", () => {
    const out = jsonForScript("x\u2028y\u2029z");
    assert.ok(!out.includes("\u2028") && !out.includes("\u2029"));
  });
});

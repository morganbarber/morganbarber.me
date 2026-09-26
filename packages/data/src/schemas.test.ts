import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  blogPostSchema,
  certificationSchema,
  competitionSchema,
  formDataToObject,
  projectSchema,
  slugSchema,
} from "./schemas.ts";

/**
 * These schemas mirror the SQL CHECK constraints and gate every admin write.
 * The database is the final boundary, but these are what turn a bad value into
 * a form error instead of a PostgREST 400 — and the link checks are what keep
 * `javascript:` out of an href before it is ever stored.
 */

const validProject = {
  id: "orion",
  title: "Project Orion",
  description: "A NIDS.",
  category: "Network Security",
  status: "Completed",
};

describe("slugSchema", () => {
  it("accepts lowercase-hyphenated slugs", () => {
    assert.equal(slugSchema.parse("zero-trust-architecture"), "zero-trust-architecture");
  });

  it("rejects anything the database CHECK would reject", () => {
    for (const bad of [
      "Zero-Trust",
      "double--hyphen",
      "-leading",
      "trailing-",
      "has space",
      "../etc",
    ]) {
      assert.equal(slugSchema.safeParse(bad).success, false, bad);
    }
  });
});

describe("projectSchema.link", () => {
  it("accepts http(s) links", () => {
    const out = projectSchema.parse({ ...validProject, link: "https://github.com/x/y" });
    assert.equal(out.link, "https://github.com/x/y");
  });

  it("rejects script-executing schemes", () => {
    for (const link of [
      "javascript:alert(1)",
      "JAVASCRIPT:alert(1)",
      "data:text/html,x",
      "vbscript:x",
    ]) {
      assert.equal(projectSchema.safeParse({ ...validProject, link }).success, false, link);
    }
  });

  it("treats an empty link as no link", () => {
    assert.equal(projectSchema.parse({ ...validProject, link: "" }).link, null);
  });
});

describe("projectSchema.tags", () => {
  it("splits, trims and drops empty entries", () => {
    const out = projectSchema.parse({ ...validProject, tags: " Python, , Scapy ,NIDS" });
    assert.deepEqual(out.tags, ["Python", "Scapy", "NIDS"]);
  });

  it("caps tags at the 24 the database allows", () => {
    const out = projectSchema.parse({
      ...validProject,
      tags: Array.from({ length: 40 }, (_, i) => `t${i}`).join(","),
    });
    assert.equal(out.tags.length, 24);
  });
});

describe("checkbox handling", () => {
  /**
   * An unchecked checkbox is absent from FormData entirely. If absence were
   * not read as false, unpublishing a post from the admin form would silently
   * leave it published.
   */
  it("reads an absent checkbox as false", () => {
    const out = blogPostSchema.parse({ slug: "a-post", title: "A post" });
    assert.equal(out.published, false);
  });

  it("reads 'on' as true", () => {
    const out = blogPostSchema.parse({ slug: "a-post", title: "A post", published: "on" });
    assert.equal(out.published, true);
  });
});

describe("certificationSchema.file_url", () => {
  it("accepts site-relative paths and https URLs", () => {
    for (const file_url of ["/certifications/sec-plus.pdf", "https://example.com/c.pdf"]) {
      assert.equal(
        certificationSchema.safeParse({ name: "Sec+", file_url }).success,
        true,
        file_url,
      );
    }
  });

  it("rejects script schemes", () => {
    assert.equal(
      certificationSchema.safeParse({ name: "x", file_url: "javascript:alert(1)" }).success,
      false,
    );
  });
});

describe("competitionSchema", () => {
  const base = { name: "picoCTF", format: "Jeopardy-style CTF", description: "CMU's CTF." };

  it("accepts the minimum and turns empty optional fields into null", () => {
    const parsed = competitionSchema.parse({ ...base, period: "", result: "  ", link: "" });
    assert.equal(parsed.period, null);
    assert.equal(parsed.result, null);
    assert.equal(parsed.link, null);
    assert.equal(parsed.team, null);
    assert.equal(parsed.published, false, "unchecked box is absent from FormData");
    assert.equal(parsed.sort_order, 0);
  });

  it("requires name, format and description", () => {
    for (const field of ["name", "format", "description"] as const) {
      assert.equal(competitionSchema.safeParse({ ...base, [field]: " " }).success, false, field);
    }
  });

  it("allows only http(s) links, matching competitions_link_scheme", () => {
    assert.equal(
      competitionSchema.safeParse({ ...base, link: "https://picoctf.org" }).success,
      true,
    );
    for (const link of ["javascript:alert(1)", "data:text/html,x", "//evil.example"]) {
      assert.equal(competitionSchema.safeParse({ ...base, link }).success, false, link);
    }
  });
});

describe("formDataToObject", () => {
  it("keeps string fields and drops files", () => {
    const form = new FormData();
    form.set("title", "Hello");
    form.set("upload", new Blob(["x"]), "x.txt");
    assert.deepEqual(formDataToObject(form), { title: "Hello" });
  });
});

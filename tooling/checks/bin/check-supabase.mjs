#!/usr/bin/env node
/**
 * Supabase preflight diagnostic.
 *
 * Answers "why is my data not showing up?" precisely, instead of leaving you to
 * infer it from an empty page. Checks, in dependency order, stopping early only
 * when a later check cannot possibly pass:
 *
 *   1. environment variables present and well-formed
 *   2. the project hostname resolves in DNS
 *   3. the REST endpoint answers and the key is accepted
 *   4. each expected table exists and is readable with the publishable key
 *   5. each expected RPC exists and is callable
 *   6. RLS actually denies what it should (a real negative test)
 *   7. published-row counts, so "empty table" is distinguishable from "broken"
 *
 * Run:  npm run check:supabase   (from the repo root or apps/portfolio)
 * Exits non-zero on any failure, so it works as a CI gate.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import dns from "node:dns/promises";

/*
  Environment files are read from the directory the command runs in — the app
  whose configuration is being checked — rather than from this package, so the
  same CLI serves any app. `npm run check:supabase` runs it from apps/portfolio.
*/
const appRoot = process.cwd();

// ---------------------------------------------------------------------------
// Output helpers
// ---------------------------------------------------------------------------

const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const ESC = "\u001b";
const paint = (code, text) => (useColor ? `${ESC}[${code}m${text}${ESC}[0m` : text);
const dim = (t) => paint("2", t);
const bold = (t) => paint("1", t);
const green = (t) => paint("32", t);
const red = (t) => paint("31", t);
const yellow = (t) => paint("33", t);

let failures = 0;
let warnings = 0;

const pass = (label, detail = "") =>
  console.log(`  ${green("PASS")}  ${label}${detail ? dim(` — ${detail}`) : ""}`);
const fail = (label, detail = "") => {
  failures += 1;
  console.log(`  ${red("FAIL")}  ${label}${detail ? ` — ${detail}` : ""}`);
};
const warn = (label, detail = "") => {
  warnings += 1;
  console.log(`  ${yellow("WARN")}  ${label}${detail ? dim(` — ${detail}`) : ""}`);
};
const section = (title) => console.log(`\n${bold(title)}`);

// ---------------------------------------------------------------------------
// Minimal .env.local reader (no dependency on dotenv being installed)
// ---------------------------------------------------------------------------

function loadEnvFile(path) {
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const match = /^\s*([\w.-]+)\s*=\s*(.*)?\s*$/.exec(line);
    if (!match || line.trimStart().startsWith("#")) continue;
    let value = (match[2] ?? "").trim();
    // Strip matching surrounding quotes.
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[match[1]] = value;
  }
  return out;
}

const fileEnv = {
  ...loadEnvFile(resolve(appRoot, ".env")),
  ...loadEnvFile(resolve(appRoot, ".env.local")),
};
const env = { ...fileEnv, ...process.env };

const TABLES = [
  "blog_posts",
  "projects",
  "experience",
  "education",
  "certifications",
  "competitions",
];
/** Tables added after the initial schema: a missing one names its migration. */
const ADDED_BY_MIGRATION = { competitions: "supabase/migrations/0003_competitions.sql" };
/** Tables the anon key must NOT be able to read. */
const FORBIDDEN_TABLES = ["analytics", "contact_messages", "rate_limit_buckets"];

const TIMEOUT_MS = 10_000;

async function request(path, init = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(`${url}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

console.log(bold("\nSupabase preflight\n" + "=".repeat(50)));

// ---------------------------------------------------------------------------
// 1. Environment
// ---------------------------------------------------------------------------

section("1. Environment");

const url = (env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");

/**
 * Supabase renamed this key when it moved off JWTs, and both names are in the
 * wild. Resolution order matches @repo/config/env so the script cannot disagree
 * with the app about which key is in use.
 */
const keySource = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ? "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
  : env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ? "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    : "(unset)";
const key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

if (!url) {
  fail("NEXT_PUBLIC_SUPABASE_URL", "not set (checked .env.local, .env, process env)");
} else if (!/^https:\/\/[^/]+$/.test(url)) {
  fail("NEXT_PUBLIC_SUPABASE_URL", `not a bare https origin: ${url}`);
} else {
  pass("NEXT_PUBLIC_SUPABASE_URL", url);
}

if (!key) {
  fail(
    "Supabase publishable key",
    "neither NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY nor NEXT_PUBLIC_SUPABASE_ANON_KEY is set",
  );
} else if (key.startsWith("sb_secret_")) {
  fail(keySource, "this is a SECRET key — it would ship to every browser");
} else if (key.startsWith("sb_publishable_")) {
  // Current-generation key: opaque, independently revocable, not a JWT. There
  // is nothing to decode, so the format check is all that can be asserted here;
  // the REST call in section 3 is what proves it actually works.
  pass(keySource, "publishable key (sb_publishable_…)");
} else {
  // Legacy anon key: a JWT, so the role, expiry and project ref can be checked.
  const segments = key.split(".");
  if (segments.length === 3) {
    try {
      const payload = JSON.parse(Buffer.from(segments[1], "base64url").toString("utf8"));
      if (payload.role === "service_role") {
        fail(keySource, "this is a SERVICE ROLE key — it must never be public");
      } else {
        pass(keySource, `legacy anon JWT (role=${payload.role}, project=${payload.ref})`);
      }
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        fail("anon key expiry", `expired ${new Date(payload.exp * 1000).toISOString()}`);
      }
      // A mismatched URL/key pair is a classic copy-paste error that surfaces
      // as confusing 401s rather than as a configuration message.
      if (payload.ref && url && !url.includes(payload.ref)) {
        fail("URL / key mismatch", `key is for project "${payload.ref}" but URL is ${url}`);
      }
    } catch {
      warn(keySource, "could not decode as a JWT");
    }
  } else {
    warn(keySource, "unrecognised key format — continuing anyway");
  }
}

if (!env.ANALYTICS_SALT) {
  warn("ANALYTICS_SALT", "not set — visitor hashing and per-visitor limits are off");
} else if (env.ANALYTICS_SALT.length < 32) {
  fail("ANALYTICS_SALT", `only ${env.ANALYTICS_SALT.length} chars; needs >= 32`);
} else {
  pass("ANALYTICS_SALT", "set");
}

if (!env.REVALIDATE_SECRET) {
  warn("REVALIDATE_SECRET", "not set — POST /api/revalidate is disabled");
} else if (env.REVALIDATE_SECRET.length < 32) {
  fail("REVALIDATE_SECRET", `only ${env.REVALIDATE_SECRET.length} chars; needs >= 32`);
} else {
  pass("REVALIDATE_SECRET", "set");
}

if (failures > 0) {
  console.log(
    `\n${red("Stopping:")} fix the environment before the connection can be tested.\n` +
      `Copy ${bold(".env.example")} to ${bold(".env.local")} and fill it in from\n` +
      `your Supabase dashboard → Project Settings → API.\n`,
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 2. DNS
// ---------------------------------------------------------------------------

section("2. DNS");

const hostname = new URL(url).hostname;
let dnsOk = false;
try {
  const records = await dns.lookup(hostname, { all: true });
  dnsOk = records.length > 0;
  pass("hostname resolves", `${hostname} → ${records.map((r) => r.address).join(", ")}`);
} catch (error) {
  if (error.code === "ENOTFOUND") {
    fail(
      "hostname does not resolve",
      `${hostname} returns NXDOMAIN.\n` +
        `        This almost always means the Supabase project was DELETED, or is\n` +
        `        PAUSED with its DNS torn down. Check https://supabase.com/dashboard —\n` +
        `        restore the project, or create a new one and update .env.local.`,
    );
  } else {
    fail("DNS lookup failed", `${hostname}: ${error.code ?? error.message}`);
  }
}

if (!dnsOk) {
  console.log(`\n${red("Stopping:")} the host is unreachable, so nothing below can be tested.\n`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 3. Connectivity and authentication
// ---------------------------------------------------------------------------

section("3. REST endpoint");

/*
  NOT the `/rest/v1/` root: that endpoint serves the OpenAPI schema and answers
  "Secret API key required" to a publishable key, so probing it reports a
  failure for a perfectly healthy project. A cheap HEAD against a real table
  exercises the same path — DNS, TLS, PostgREST, key acceptance — and tells the
  truth.
*/
try {
  const response = await request(`/rest/v1/${TABLES[0]}?select=id&limit=1`, { method: "HEAD" });
  if (response.status === 401 || response.status === 403) {
    fail("public key rejected", `HTTP ${response.status} — the key does not match this project`);
  } else if (response.ok || response.status === 206) {
    pass("PostgREST reachable", `HTTP ${response.status}`);
  } else {
    warn("unexpected status", `HTTP ${response.status}`);
  }
} catch (error) {
  fail("could not reach PostgREST", error.cause?.code ?? error.message);
  console.log(`\n${red("Stopping:")} no usable connection.\n`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 4. Tables
// ---------------------------------------------------------------------------

section("4. Tables readable with the publishable key");

const counts = {};

for (const table of TABLES) {
  try {
    const response = await request(`/rest/v1/${table}?select=*&limit=1`, {
      headers: { Prefer: "count=exact" },
    });

    if (response.status === 404) {
      fail(
        table,
        `table does not exist — run ${ADDED_BY_MIGRATION[table] ?? "supabase/schema.sql"}`,
      );
      continue;
    }
    if (response.status === 401 || response.status === 403) {
      fail(table, "permission denied — the SELECT policy or grant is missing");
      continue;
    }
    if (!response.ok) {
      const body = await response.text();
      fail(table, `HTTP ${response.status} ${body.slice(0, 120)}`);
      continue;
    }

    // content-range looks like "0-0/7"; the part after the slash is the count.
    const range = response.headers.get("content-range") ?? "";
    const total = Number(range.split("/")[1]);
    counts[table] = Number.isFinite(total) ? total : null;
    pass(table, `${counts[table] ?? "?"} published row(s)`);
  } catch (error) {
    fail(table, error.message);
  }
}

// ---------------------------------------------------------------------------
// 5. RLS negative tests
// ---------------------------------------------------------------------------

section("5. Private tables are NOT readable (negative test)");

for (const table of FORBIDDEN_TABLES) {
  try {
    const response = await request(`/rest/v1/${table}?select=*&limit=1`);
    if (response.ok) {
      const rows = await response.json();
      if (Array.isArray(rows) && rows.length === 0) {
        // RLS returning zero rows is acceptable, but a missing grant is better.
        warn(table, "readable but empty — prefer revoking SELECT from anon entirely");
      } else {
        fail(table, `READABLE with the public key (${rows.length} row(s) returned)`);
      }
    } else {
      pass(table, `denied (HTTP ${response.status})`);
    }
  } catch (error) {
    warn(table, error.message);
  }
}

// ---------------------------------------------------------------------------
// 6. RPCs
// ---------------------------------------------------------------------------

section("6. Functions callable");

/*
  Each probe sends well-formed arguments that the function's own validation
  rejects, so existence and the EXECUTE grant are confirmed WITHOUT writing a
  row. Sending `{}` instead would be simpler but wrong twice over: PostgREST
  resolves overloads by argument name, so a no-arg call returns 404 for a
  function that exists perfectly well — and a call with *valid* arguments would
  insert real junk into the analytics and contact tables every time the
  diagnostic runs.
*/
const RPC_PROBES = [
  {
    name: "health_check",
    body: {},
    // No arguments and no side effects; any 2xx is success.
    ok: (status) => status >= 200 && status < 300,
  },
  {
    name: "track_event",
    // A path that does not start with "/" fails the guard and returns early.
    body: { p_path: "probe-no-leading-slash", p_event_name: "preflight" },
    ok: (status) => status >= 200 && status < 300,
  },
  {
    name: "submit_contact_message",
    // An empty name fails the guard and returns 'invalid' without inserting.
    body: { p_name: "", p_message: "" },
    ok: (status, body) => status >= 200 && status < 300 && body.includes("invalid"),
  },
];

for (const probe of RPC_PROBES) {
  try {
    const response = await request(`/rest/v1/rpc/${probe.name}`, {
      method: "POST",
      body: JSON.stringify(probe.body),
    });
    const body = await response.text();

    if (response.status === 404) {
      fail(probe.name, "function not found — run supabase/schema.sql");
    } else if (response.status === 401 || response.status === 403) {
      fail(probe.name, "EXECUTE not granted to the publishable key");
    } else if (probe.ok(response.status, body)) {
      pass(probe.name, `callable, input validation active (HTTP ${response.status})`);
    } else {
      warn(probe.name, `unexpected response: HTTP ${response.status} ${body.slice(0, 80)}`);
    }
  } catch (error) {
    fail(probe.name, error.message);
  }
}

// ---------------------------------------------------------------------------
// 7. Content sanity
// ---------------------------------------------------------------------------

section("7. Content");

const empty = Object.entries(counts)
  .filter(([, n]) => n === 0)
  .map(([t]) => t);
if (empty.length === TABLES.length) {
  warn("every table is empty", "run supabase/seed.sql, or set published = true on your rows");
} else if (empty.length > 0) {
  warn(`empty: ${empty.join(", ")}`, "no published rows — check the `published` column");
} else {
  pass("all content tables have published rows");
}

// ---------------------------------------------------------------------------

console.log("\n" + "=".repeat(50));
if (failures > 0) {
  console.log(
    red(bold(`${failures} check(s) failed`)) + (warnings ? dim(`, ${warnings} warning(s)`) : ""),
  );
  process.exit(1);
}
console.log(
  green(bold("All checks passed")) + (warnings ? yellow(` (${warnings} warning(s))`) : ""),
);
console.log();

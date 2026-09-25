#!/usr/bin/env node
/**
 * Security-header verifier.
 *
 * Asserts that a running instance actually sends the headers this project
 * claims to send, and that the CSP is genuinely strict rather than nominally
 * present. Regressions here are silent — a policy that stops being emitted
 * looks exactly like one that is working — so this exists to make them loud.
 *
 * Usage:
 *   npm run check:headers                      # http://localhost:3000
 *   npm run check:headers -- https://morganbarber.me
 *
 * Exits non-zero on any failure, so it can gate a deploy.
 */

const target = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
const isLocal = /^http:\/\/(localhost|127\.0\.0\.1)/.test(target);

const ESC = "\u001b";
const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const paint = (code, text) => (useColor ? `${ESC}[${code}m${text}${ESC}[0m` : text);
const green = (t) => paint("32", t);
const red = (t) => paint("31", t);
const yellow = (t) => paint("33", t);
const bold = (t) => paint("1", t);
const dim = (t) => paint("2", t);

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

console.log(bold(`\nSecurity headers — ${target}\n${"=".repeat(50)}`));

let response;
let html;
try {
  response = await fetch(target, { redirect: "follow" });
  html = await response.text();
} catch (error) {
  console.error(red(`\nCould not reach ${target}: ${error.cause?.code ?? error.message}`));
  console.error(dim("Start the server first (npm run build && npm start).\n"));
  process.exit(1);
}

const header = (name) => response.headers.get(name);

// ---------------------------------------------------------------------------
console.log(bold("\nRequired headers"));

const required = {
  "x-frame-options": (v) => (/^(DENY|SAMEORIGIN)$/i.test(v) ? null : `unexpected value: ${v}`),
  "x-content-type-options": (v) =>
    v.toLowerCase() === "nosniff" ? null : `expected nosniff, got ${v}`,
  "referrer-policy": (v) => (/no-referrer|strict-origin/i.test(v) ? null : `weak policy: ${v}`),
  "permissions-policy": () => null,
  "cross-origin-opener-policy": (v) =>
    v.toLowerCase() === "same-origin" ? null : `expected same-origin, got ${v}`,
  "cross-origin-resource-policy": () => null,
  "content-security-policy": () => null,
};

/*
  COEP is required for cross-origin isolation but must be absent in dev, where
  the HMR websocket and error overlay do not satisfy it. Checked separately so
  each case gets the right verdict rather than a blanket "present or missing".
*/
const coep = header("cross-origin-embedder-policy");

for (const [name, validate] of Object.entries(required)) {
  const value = header(name);
  if (!value) {
    fail(name, "missing");
    continue;
  }
  const problem = validate(value);
  if (problem) fail(name, problem);
  else pass(name, value.length > 60 ? `${value.slice(0, 57)}...` : value);
}

if (isLocal) {
  pass("cross-origin-embedder-policy", coep ?? "absent (expected for a dev build)");
} else if (!coep) {
  fail("cross-origin-embedder-policy", "missing — the page is not cross-origin isolated");
} else if (!/^(credentialless|require-corp)$/.test(coep)) {
  warn("cross-origin-embedder-policy", `unexpected value: ${coep}`);
} else {
  pass("cross-origin-embedder-policy", coep);
}

// HSTS is meaningless (and harmful) over plain http on localhost.
const hsts = header("strict-transport-security");
if (isLocal) {
  if (hsts) warn("strict-transport-security", "set on a local http origin");
  else pass("strict-transport-security", "correctly omitted for local http");
} else if (!hsts) {
  fail("strict-transport-security", "missing on an https origin");
} else {
  const maxAge = Number(/max-age=(\d+)/.exec(hsts)?.[1] ?? 0);
  if (maxAge < 15552000) fail("strict-transport-security", `max-age ${maxAge} is under 180 days`);
  else if (!/includeSubDomains/i.test(hsts))
    warn("strict-transport-security", "no includeSubDomains");
  else pass("strict-transport-security", hsts);
}

// ---------------------------------------------------------------------------
console.log(bold("\nHeaders that must NOT be present"));

for (const name of ["x-powered-by", "server"]) {
  const value = header(name);
  if (!value) pass(name, "absent");
  else if (name === "server" && /^(cloudflare|vercel)$/i.test(value)) {
    pass(name, `${value} (set by the platform edge)`);
  } else {
    warn(name, `leaks stack detail: ${value}`);
  }
}

// ---------------------------------------------------------------------------
console.log(bold("\nContent-Security-Policy quality"));

const csp = header("content-security-policy") ?? "";
const directives = Object.fromEntries(
  csp
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [name, ...values] = part.split(/\s+/);
      return [name.toLowerCase(), values];
    }),
);

const scriptSrc = (directives["script-src"] ?? directives["default-src"] ?? []).join(" ");

if (!scriptSrc) {
  fail("script-src", "neither script-src nor default-src is set");
} else {
  if (/'unsafe-inline'/.test(scriptSrc) && !/'strict-dynamic'/.test(scriptSrc)) {
    fail("script-src", "'unsafe-inline' without 'strict-dynamic' — the CSP does not stop XSS");
  }
  if (/'unsafe-eval'/.test(scriptSrc)) {
    (isLocal ? warn : fail)("script-src", "'unsafe-eval' is allowed");
  }
  if (/'nonce-/.test(scriptSrc)) pass("script-src", "nonce-based");
  else warn("script-src", "no nonce — verify the policy is still strict");
  if (/'strict-dynamic'/.test(scriptSrc)) pass("script-src", "'strict-dynamic' present");
}

for (const [directive, expected] of Object.entries({
  "object-src": "'none'",
  "base-uri": "'none'",
  "frame-ancestors": "'none'",
})) {
  const value = (directives[directive] ?? []).join(" ");
  if (!value) fail(directive, `missing (expected ${expected})`);
  else if (value !== expected) warn(directive, `is "${value}", expected ${expected}`);
  else pass(directive, value);
}

if (!directives["form-action"]) warn("form-action", "not set");
else pass("form-action", directives["form-action"].join(" "));

// style-src: an injected <style> is an exfiltration primitive (attribute
// selectors + background:url() leak input values), so 'unsafe-inline' here is
// not harmless even though it cannot execute script.
const styleSrc = (directives["style-src"] ?? []).join(" ");
if (!styleSrc) {
  warn("style-src", "not set");
} else if (/'unsafe-inline'/.test(styleSrc)) {
  (isLocal ? warn : fail)("style-src", "'unsafe-inline' allows injected <style> elements");
} else if (/'nonce-/.test(styleSrc)) {
  pass("style-src", "nonce-based");
} else {
  pass("style-src", styleSrc);
}

// Reporting: a CSP that cannot report is a CSP whose failures are invisible.
if (!directives["report-to"] && !directives["report-uri"]) {
  warn("reporting", "no report-to or report-uri — violations go unseen");
} else if (!header("reporting-endpoints")) {
  warn("reporting", "report-to is set but the Reporting-Endpoints header is missing");
} else {
  pass(
    "reporting",
    `${directives["report-to"]?.join(" ") ?? "report-uri only"} + Reporting-Endpoints`,
  );
}

// Trusted Types, expected report-only for now.
const reportOnly = header("content-security-policy-report-only") ?? "";
if (/require-trusted-types-for/.test(reportOnly)) {
  pass("trusted-types", "report-only (discovery mode)");
} else if (/require-trusted-types-for/.test(csp)) {
  pass("trusted-types", "ENFORCED");
} else {
  warn("trusted-types", "not present in either policy");
}

// ---------------------------------------------------------------------------
console.log(bold("\nNonce propagation"));

const cspNonce = /'nonce-([^']+)'/.exec(csp)?.[1];
const htmlNonces = [...html.matchAll(/nonce="([^"]+)"/g)].map((m) => m[1]);
const scriptTags = [...html.matchAll(/<script([^>]*)>/g)].map((m) => m[1]);
const unNonced = scriptTags.filter((attrs) => !/nonce=/.test(attrs));

// <style> elements are subject to the nonce as well once style-src is
// nonce-based. A missed one does not throw an error anywhere — the browser
// silently drops it — so an un-nonced stylesheet means an unstyled site.
const styleTags = [...html.matchAll(/<style([^>]*)>/g)].map((m) => m[1]);
const styleNonceRequired = /'nonce-/.test(
  (directives["style-src-elem"] ?? directives["style-src"] ?? []).join(" "),
);
const unNoncedStyles = styleTags.filter((attrs) => !/nonce=/.test(attrs));
if (styleNonceRequired && unNoncedStyles.length > 0) {
  fail(
    "style nonce",
    `${unNoncedStyles.length} of ${styleTags.length} <style> tags have no nonce — they will be BLOCKED`,
  );
} else if (styleTags.length > 0) {
  pass("style nonce", `matches on all ${styleTags.length} style tag(s)`);
}

if (!cspNonce) {
  warn("nonce", "no nonce in the CSP header");
} else if (unNonced.length > 0) {
  fail(
    "nonce",
    `${unNonced.length} of ${scriptTags.length} <script> tags have no nonce — ` +
      `they will be BLOCKED by this policy`,
  );
} else if (!htmlNonces.every((n) => n === cspNonce)) {
  fail("nonce", "a nonce in the HTML does not match the one in the CSP header");
} else {
  pass("nonce", `matches on all ${scriptTags.length} script tag(s)`);
}

// ---------------------------------------------------------------------------
console.log(bold("\nIndexing"));

const robots = header("x-robots-tag");
if (isLocal) {
  pass("x-robots-tag", robots ? `${robots} (local)` : "absent (local)");
} else if (/morganbarber\.me$/.test(new URL(target).hostname)) {
  // Production must stay indexable.
  if (robots && /noindex/i.test(robots)) {
    fail("x-robots-tag", `production is marked noindex: ${robots}`);
  } else {
    pass("x-robots-tag", "production is indexable");
  }
} else {
  // Anything else is a preview: a full copy of the site on a guessable URL.
  if (robots && /noindex/i.test(robots)) {
    pass("x-robots-tag", `preview is noindex: ${robots}`);
  } else {
    fail("x-robots-tag", "a non-production deployment is indexable");
  }
}

// ---------------------------------------------------------------------------
console.log(bold("\nProbe-path filtering"));

for (const path of ["/.env", "/wp-login.php", "/.git/config"]) {
  try {
    const probe = await fetch(`${target}${path}`, { redirect: "manual" });
    if (probe.status === 404 || probe.status === 403) pass(path, `HTTP ${probe.status}`);
    else warn(path, `HTTP ${probe.status} (expected 404)`);
  } catch (error) {
    warn(path, error.message);
  }
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

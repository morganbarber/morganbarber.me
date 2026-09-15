import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@repo/security/rate-limit";
import { clientIp } from "@repo/security/request";
import { auditLog } from "@repo/security/audit";

/**
 * POST /api/csp-report — collects Content-Security-Policy violation reports.
 *
 * Without somewhere to send them, a CSP failure is invisible: the page quietly
 * loses a script and nobody finds out until a user reports a broken feature.
 * Reports are also the only signal that an injection attempt was *blocked*.
 *
 * This endpoint is unusual in one respect: the browser posts to it
 * cross-origin, unauthenticated, and with no `Origin` the page controls — so it
 * cannot use the same-origin check the analytics endpoint does. That makes it
 * trivially spammable by anyone, which shapes every decision below:
 *
 *   • hard body-size cap, checked before reading
 *   • aggressive rate limit per source, well under what a real browser sends
 *   • reports are logged, never stored — an unauthenticated endpoint that
 *     writes to the database is a free disk-filling primitive
 *   • noisy, low-value violations are dropped rather than logged
 *   • always 204, whatever happens
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Real reports are ~1 KB. Anything larger is not a browser. */
const MAX_BODY_BYTES = 8192;

// A browser sends at most a handful per page load; 20/min is generous.
const PER_SOURCE_LIMIT = 20;
const PER_SOURCE_WINDOW_MS = 60_000;

/**
 * Browsers send two different shapes: the legacy `report-uri` body
 * (`{"csp-report": {...}}`, content-type `application/csp-report`) and the
 * Reporting API body (an array of `{type, body}`, content-type
 * `application/reports+json`). Both are accepted.
 */
const legacyReportSchema = z.object({
  "csp-report": z
    .object({
      "document-uri": z.string().max(2048).optional(),
      "violated-directive": z.string().max(256).optional(),
      "effective-directive": z.string().max(256).optional(),
      "blocked-uri": z.string().max(2048).optional(),
      "script-sample": z.string().max(512).optional(),
      "line-number": z.number().optional(),
      disposition: z.string().max(32).optional(),
    })
    .passthrough(),
});

const reportingApiSchema = z.array(
  z
    .object({
      type: z.string().max(64).optional(),
      url: z.string().max(2048).optional(),
      body: z
        .object({
          documentURL: z.string().max(2048).optional(),
          effectiveDirective: z.string().max(256).optional(),
          blockedURL: z.string().max(2048).optional(),
          sample: z.string().max(512).optional(),
          disposition: z.string().max(32).optional(),
        })
        .passthrough()
        .optional(),
    })
    .passthrough(),
);

interface Violation {
  directive: string;
  blocked: string;
  document: string;
  sample: string;
  disposition: string;
}

/**
 * Violations that say nothing about this site.
 *
 * Browser extensions inject scripts and stylesheets into every page and
 * generate a constant stream of violations the site cannot fix or influence.
 * Left in, they bury the reports that actually matter.
 */
const NOISE = [
  /^(chrome|moz|safari|webkit|ms-browser)-extension:/i,
  /^(about|data|blob|filesystem):/i,
  /^resource:/i,
  // Chrome reports a blocked inline handler as the literal string "inline"
  // from extension-injected markup more often than from real injection.
  /^asset:/i,
];

function isNoise(violation: Violation): boolean {
  return NOISE.some((pattern) => pattern.test(violation.blocked));
}

function normalise(payload: unknown): Violation[] {
  const legacy = legacyReportSchema.safeParse(payload);
  if (legacy.success) {
    const report = legacy.data["csp-report"];
    return [
      {
        directive: report["effective-directive"] ?? report["violated-directive"] ?? "unknown",
        blocked: report["blocked-uri"] ?? "unknown",
        document: report["document-uri"] ?? "unknown",
        sample: report["script-sample"] ?? "",
        disposition: report.disposition ?? "enforce",
      },
    ];
  }

  const modern = reportingApiSchema.safeParse(payload);
  if (modern.success) {
    return modern.data
      .filter((entry) => entry.type === "csp-violation" || entry.body)
      .map((entry) => ({
        directive: entry.body?.effectiveDirective ?? "unknown",
        blocked: entry.body?.blockedURL ?? "unknown",
        document: entry.body?.documentURL ?? entry.url ?? "unknown",
        sample: entry.body?.sample ?? "",
        disposition: entry.body?.disposition ?? "enforce",
      }));
  }

  return [];
}

export async function POST(request: Request): Promise<NextResponse> {
  const done = () => new NextResponse(null, { status: 204 });

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > MAX_BODY_BYTES) return done();

  const source = clientIp(request.headers) ?? "unknown";
  if (!rateLimit(`csp-report:${source}`, PER_SOURCE_LIMIT, PER_SOURCE_WINDOW_MS).allowed) {
    return done();
  }

  let payload: unknown;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) return done();
    payload = JSON.parse(text);
  } catch {
    return done();
  }

  for (const violation of normalise(payload)) {
    if (isNoise(violation)) continue;

    /*
      Logged, not stored — a database write on an unauthenticated endpoint is
      an unbounded insert primitive.

      Routed through auditLog rather than console.warn because every field
      here is attacker-controlled: the whole body arrives in a POST. Zod caps
      the lengths but does not strip newlines, so interpolating `blocked` or
      `sample` into a log line directly is CWE-117 log injection — a newline
      forges an entry, and an ANSI escape can rewrite a terminal. auditLog
      redacts every value.
    */
    auditLog("csp.violation", {
      disposition: violation.disposition,
      directive: violation.directive,
      blocked: violation.blocked,
      document: violation.document,
      sample: violation.sample || undefined,
    });
  }

  return done();
}

export async function GET(): Promise<NextResponse> {
  return new NextResponse(null, { status: 405, headers: { Allow: "POST" } });
}

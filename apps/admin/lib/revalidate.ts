import "server-only";

/**
 * Tells the public site to drop its cached content after an edit.
 *
 * The portfolio caches every Supabase read for an hour. Without this ping a
 * published post would not appear until that expired, which makes the admin
 * dashboard feel broken even though the write succeeded.
 *
 * Both variables are optional. When either is missing this is a no-op that
 * reports why, and the caller surfaces it as a note on an otherwise successful
 * save — a cache that refreshes late is a much smaller problem than a save that
 * appears to fail.
 */

const TIMEOUT_MS = 4000;

export interface RevalidateResult {
  ok: boolean;
  reason?: string;
}

export async function notifyPortfolio(table: string): Promise<RevalidateResult> {
  const baseUrl = process.env.PORTFOLIO_URL;
  const secret = process.env.REVALIDATE_SECRET;

  if (!baseUrl) return { ok: false, reason: "PORTFOLIO_URL is not set" };
  if (!secret) return { ok: false, reason: "REVALIDATE_SECRET is not set" };

  /*
    Validate the destination before fetching it (OWASP A10:2021 — SSRF).

    PORTFOLIO_URL is operator-configured rather than user input, so this is not
    a live vulnerability — but this request carries REVALIDATE_SECRET in a
    header, and a typo'd or tampered value would send that secret to whatever
    host it named. Restricting the scheme to http(s) and rejecting embedded
    credentials keeps a configuration mistake from becoming a secret leak.
  */
  let target: URL;
  try {
    target = new URL(`${baseUrl.replace(/\/$/, "")}/api/revalidate`);
  } catch {
    return { ok: false, reason: "PORTFOLIO_URL is not a valid URL" };
  }

  if (target.protocol !== "http:" && target.protocol !== "https:") {
    return { ok: false, reason: `PORTFOLIO_URL must be http or https, not ${target.protocol}` };
  }

  if (target.username || target.password) {
    return { ok: false, reason: "PORTFOLIO_URL must not contain credentials" };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(target, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-revalidate-secret": secret,
      },
      body: JSON.stringify({ table }),
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        ok: false,
        reason:
          response.status === 401
            ? "the portfolio rejected the secret — check REVALIDATE_SECRET matches on both sides"
            : `the portfolio returned HTTP ${response.status}`,
      };
    }

    return { ok: true };
  } catch (error) {
    // The portfolio simply may not be running, which is normal while editing.
    return {
      ok: false,
      reason:
        error instanceof Error && error.name === "AbortError"
          ? "the portfolio did not respond in time"
          : "the portfolio is not reachable",
    };
  } finally {
    clearTimeout(timer);
  }
}

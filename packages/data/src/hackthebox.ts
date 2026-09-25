import "server-only";

import { unstable_cache } from "next/cache";
import { HACKTHEBOX, hackTheBoxProfileUrl } from "@repo/config/site";
import { getServerEnv } from "@repo/config/server-env";
import {
  count,
  parseBasicProfile,
  parseProgress,
  topFocusAreas,
  type BasicProfile,
  type FocusArea,
  type Progress,
} from "./hackthebox-parse";

/**
 * HackTheBox profile stats.
 *
 * Live when `HTB_APP_TOKEN` is set, static (`HACKTHEBOX.fallback`) otherwise.
 * HTB's v4 API rejects unauthenticated requests — verified: the profile route
 * answers 401 "Unauthenticated", not 404 — so there is no token-free live path.
 *
 * Three endpoints — basic profile, challenge progress, Sherlock progress —
 * fetched on the server and cached for six hours:
 *
 *   • The token is a credential for the HTB account. Fetching server-side keeps
 *     it off the client entirely.
 *   • No CSP change is needed. A browser-side fetch or a hotlinked avatar would
 *     mean adding labs.hackthebox.com to connect-src/img-src — and, under COEP,
 *     trusting that host's CORP headers too.
 *   • Rank changes over days, not seconds. Six hours keeps the section current
 *     while making at most a dozen upstream calls a day, which matters for an
 *     undocumented API with unpublished rate limits.
 *
 * Fail-soft like the rest of the data layer: any failure — no token, network
 * error, 401, a response shape HTB changed without notice — yields the static
 * fallback, never an error page.
 */

/** Fixed host. Nothing request-derived ever reaches the URL (OWASP A10). */
const API_BASE = "https://labs.hackthebox.com/api/v4";

const TIMEOUT_MS = 6000;

/** Upper bound on the response we are willing to parse. */
const MAX_RESPONSE_BYTES = 64 * 1024;

export const HACKTHEBOX_CACHE_TAG = "hackthebox";

/**
 * What the portfolio shows. Every count is null unless it is a real, positive
 * number (see hackthebox-parse.ts) — the UI renders only non-null values.
 */
export interface HackTheBoxStats extends BasicProfile {
  /** "live" when fetched from HTB, "static" when from the config fallback. */
  source: "live" | "static";
  profileUrl: string;
  challengesSolved: number | null;
  sherlocksSolved: number | null;
  /** Individual Sherlock questions answered. */
  sherlockTasks: number | null;
  /** Categories with at least one solve, most-solved first. */
  focusAreas: FocusArea[];
}

function staticStats(profileUrl: string): HackTheBoxStats {
  const f = HACKTHEBOX.fallback;
  return {
    source: "static",
    username: HACKTHEBOX.username,
    profileUrl,
    rank: f.rank,
    nextRank: null,
    rankProgress: null,
    points: count(f.points),
    userOwns: count(f.userOwns),
    systemOwns: count(f.systemOwns),
    memberSince: null,
    challengesSolved: count(f.challengesSolved),
    sherlocksSolved: count(f.sherlocksSolved),
    sherlockTasks: null,
    focusAreas: [],
  };
}

/**
 * One authenticated GET, returning parsed JSON or null. Never throws, never
 * logs a response body (an auth failure can echo request details, and the
 * profile body contains personal data).
 */
async function fetchJson(path: string, token: string): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "User-Agent": "morganbarber.me (portfolio profile widget)",
      },
      signal: controller.signal,
      // unstable_cache below is the cache; the fetch-level cache would key on
      // the Authorization header and hold a second, unmanaged copy.
      cache: "no-store",
      redirect: "error",
    });

    if (!response.ok) {
      console.error(
        `[hackthebox] ${path.split("/")[3] ?? "request"} failed: HTTP ${response.status}`,
      );
      return null;
    }

    const text = await response.text();
    if (text.length > MAX_RESPONSE_BYTES) {
      console.error("[hackthebox] response exceeded size limit; ignoring");
      return null;
    }
    return JSON.parse(text) as unknown;
  } catch (error) {
    console.error(
      "[hackthebox] unreachable:",
      error instanceof Error ? error.name : "unknown error",
    );
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function token(): string | null {
  try {
    return getServerEnv().HTB_APP_TOKEN ?? null;
  } catch {
    return null;
  }
}

/**
 * Each endpoint is cached separately, and a failure THROWS inside the cache
 * boundary so it is never stored (ADR 0005): one transient error on the
 * challenges endpoint costs a retry, not six hours of a missing tile — and
 * cannot evict the profile data that did load.
 */
const cacheOptions = { revalidate: 6 * 60 * 60, tags: [HACKTHEBOX_CACHE_TAG] };

const cachedBasic = unstable_cache(
  async (profileId: number): Promise<BasicProfile> => {
    const t = token();
    if (!t) throw new Error("no token");
    const parsed = parseBasicProfile(await fetchJson(`/user/profile/basic/${profileId}`, t));
    if (!parsed) throw new Error("hackthebox profile unavailable");
    return parsed;
  },
  ["hackthebox", "basic"],
  cacheOptions,
);

const cachedProgress = unstable_cache(
  async (profileId: number, kind: FocusArea["kind"]): Promise<Progress> => {
    const t = token();
    if (!t) throw new Error("no token");
    const segment = kind === "Sherlocks" ? "sherlocks" : "challenges";
    const parsed = parseProgress(
      await fetchJson(`/user/profile/progress/${segment}/${profileId}`, t),
      kind,
    );
    if (!parsed) throw new Error(`hackthebox ${segment} unavailable`);
    return parsed;
  },
  ["hackthebox", "progress"],
  cacheOptions,
);

/**
 * Stats for the configured profile, or null when no profile is configured —
 * in which case the section is not rendered at all.
 */
export async function getHackTheBoxStats(): Promise<HackTheBoxStats | null> {
  const profileId = HACKTHEBOX.profileId;

  // Validated even though it comes from config: it is interpolated into a URL
  // path, and an integer check is the whole of the defence against a typo
  // turning into a request to a different route.
  if (!profileId || !Number.isSafeInteger(profileId) || profileId <= 0) {
    return null;
  }

  const profileUrl = hackTheBoxProfileUrl() ?? `https://app.hackthebox.com/users/${profileId}`;

  const [basic, challenges, sherlocks] = await Promise.all([
    cachedBasic(profileId).catch(() => null),
    cachedProgress(profileId, "Challenges").catch(() => null),
    cachedProgress(profileId, "Sherlocks").catch(() => null),
  ]);

  // The profile is the anchor: without it there is no rank or machine data,
  // and a section of only challenge counts would misrepresent the account.
  if (!basic) return staticStats(profileUrl);

  return {
    ...basic,
    username: basic.username ?? HACKTHEBOX.username,
    source: "live",
    profileUrl,
    challengesSolved: challenges?.solved ?? null,
    sherlocksSolved: sherlocks?.solved ?? null,
    sherlockTasks: sherlocks?.tasks ?? null,
    focusAreas: topFocusAreas([challenges, sherlocks]),
  };
}

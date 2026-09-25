import "server-only";

import { unstable_cache } from "next/cache";
import { z } from "zod";
import { HACKTHEBOX, hackTheBoxProfileUrl } from "@repo/config/site";
import { getServerEnv } from "@repo/config/server-env";

/**
 * HackTheBox profile stats.
 *
 * Live when `HTB_APP_TOKEN` is set, static (`HACKTHEBOX.fallback`) otherwise.
 * HTB's v4 API rejects unauthenticated requests — verified: the profile route
 * answers 401 "Unauthenticated", not 404 — so there is no token-free live path.
 *
 * Fetched on the server and cached for six hours:
 *
 *   • The token is a credential for the HTB account. Fetching server-side keeps
 *     it off the client entirely.
 *   • No CSP change is needed. A browser-side fetch or a hotlinked avatar would
 *     mean adding labs.hackthebox.com to connect-src/img-src — and, under COEP,
 *     trusting that host's CORP headers too.
 *   • Rank changes over days, not seconds. Six hours keeps the section current
 *     while making at most four upstream calls a day, which matters for an
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

export interface HackTheBoxStats {
  /** "live" when fetched from HTB, "static" when from the config fallback. */
  source: "live" | "static";
  username: string | null;
  profileUrl: string;
  rank: string | null;
  /** Global leaderboard position. */
  ranking: number | null;
  points: number | null;
  userOwns: number | null;
  systemOwns: number | null;
  userBloods: number | null;
  systemBloods: number | null;
  respects: number | null;
  /** Percentage progress through the current rank, 0–100. */
  rankProgress: number | null;
  nextRank: string | null;
  country: string | null;
}

/**
 * HTB's response, parsed defensively.
 *
 * The API is undocumented and has changed shape before, so every field is
 * optional and coerced: a renamed or retyped field degrades to "not shown"
 * rather than failing the whole parse. Numbers sometimes arrive as strings
 * (rank_ownership is "12.34"), hence the coercion.
 */
const optionalNumber = z
  .union([z.number(), z.string()])
  .optional()
  .nullable()
  .transform((value) => {
    if (value === null || value === undefined || value === "") return null;
    const n = typeof value === "number" ? value : Number(value);
    return Number.isFinite(n) ? n : null;
  });

const optionalText = z
  .string()
  .max(120)
  .optional()
  .nullable()
  .transform((value) => (value ? value : null));

const profileSchema = z.object({
  profile: z
    .object({
      name: optionalText,
      rank: optionalText,
      ranking: optionalNumber,
      points: optionalNumber,
      user_owns: optionalNumber,
      system_owns: optionalNumber,
      user_bloods: optionalNumber,
      system_bloods: optionalNumber,
      respects: optionalNumber,
      current_rank_progress: optionalNumber,
      rank_ownership: optionalNumber,
      next_rank: optionalText,
      country_name: optionalText,
    })
    .passthrough(),
});

function staticStats(profileUrl: string): HackTheBoxStats {
  const f = HACKTHEBOX.fallback;
  return {
    source: "static",
    username: HACKTHEBOX.username,
    profileUrl,
    rank: f.rank,
    ranking: f.ranking,
    points: f.points,
    userOwns: f.userOwns,
    systemOwns: f.systemOwns,
    userBloods: null,
    systemBloods: null,
    respects: f.respects,
    rankProgress: null,
    nextRank: null,
    country: null,
  };
}

/** Clamps a percentage into range; HTB has returned values outside 0–100. */
function percent(value: number | null): number | null {
  if (value === null) return null;
  return Math.min(100, Math.max(0, Math.round(value)));
}

async function fetchLiveStats(
  profileId: number,
  token: string,
  profileUrl: string,
): Promise<HackTheBoxStats | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE}/user/profile/basic/${profileId}`, {
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
      // Status only: the body of an auth failure can echo request details.
      console.error(`[hackthebox] profile request failed: HTTP ${response.status}`);
      return null;
    }

    const text = await response.text();
    if (text.length > MAX_RESPONSE_BYTES) {
      console.error("[hackthebox] response exceeded size limit; ignoring");
      return null;
    }

    const parsed = profileSchema.safeParse(JSON.parse(text));
    if (!parsed.success) {
      console.error("[hackthebox] unexpected response shape; using fallback");
      return null;
    }

    const p = parsed.data.profile;
    return {
      source: "live",
      username: p.name ?? HACKTHEBOX.username,
      profileUrl,
      rank: p.rank,
      ranking: p.ranking,
      points: p.points,
      userOwns: p.user_owns,
      systemOwns: p.system_owns,
      userBloods: p.user_bloods,
      systemBloods: p.system_bloods,
      respects: p.respects,
      rankProgress: percent(p.current_rank_progress),
      nextRank: p.next_rank,
      country: p.country_name,
    };
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

const cachedLiveStats = unstable_cache(
  async (profileId: number, profileUrl: string): Promise<HackTheBoxStats | null> => {
    let token: string | undefined;
    try {
      token = getServerEnv().HTB_APP_TOKEN;
    } catch {
      return null;
    }
    if (!token) return null;

    const live = await fetchLiveStats(profileId, token, profileUrl);
    // A failed fetch must not be cached: throwing keeps unstable_cache from
    // storing it, so the next request retries instead of showing the static
    // fallback for six hours after one transient HTB error.
    if (!live) throw new Error("hackthebox fetch failed");
    return live;
  },
  ["hackthebox", "profile"],
  { revalidate: 6 * 60 * 60, tags: [HACKTHEBOX_CACHE_TAG] },
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
  const live = await cachedLiveStats(profileId, profileUrl).catch(() => null);
  return live ?? staticStats(profileUrl);
}

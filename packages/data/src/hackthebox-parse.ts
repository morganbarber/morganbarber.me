import { z } from "zod";

/**
 * Pure parsing for HackTheBox API responses — no I/O, no Next.js — so it can be
 * unit-tested with the Node runner. `hackthebox.ts` does the fetching/caching.
 *
 * Two rules shape everything here:
 *
 *   • Zero means absent. The section showcases what the profile HAS; a tile
 *     reading "0 bloods" or "0 respect" is noise at best. Every count that is 0
 *     (or missing, or malformed) comes out as null, and the UI renders only
 *     non-null values — so a stat appears on its own the day it becomes real.
 *   • Strip, never pass through. The basic-profile response carries personal
 *     data (full name, phone number, timezone). The schemas are plain
 *     `z.object`s, which drop unknown keys, and only named fields are mapped —
 *     nothing else can reach the cache or the page.
 */

/** HTB sends numbers as numbers or numeric strings ("12.34"); anything else is null. */
const looseNumber = z
  .union([z.number(), z.string()])
  .nullish()
  .transform((value) => {
    if (value === null || value === undefined || value === "") return null;
    const n = typeof value === "number" ? value : Number(value);
    return Number.isFinite(n) ? n : null;
  });

const looseText = z
  .string()
  .max(120)
  .nullish()
  .transform((value) => (value ? value : null));

/** A positive count, or null. */
export function count(value: number | null): number | null {
  return value !== null && value > 0 ? Math.floor(value) : null;
}

/** A percentage clamped to 0–100 and rounded; HTB has returned values outside that range. */
export function percent(value: number | null): number | null {
  if (value === null) return null;
  return Math.min(100, Math.max(0, Math.round(value)));
}

// -----------------------------------------------------------------------------
// GET /user/profile/basic/{id}

export const basicProfileSchema = z.object({
  profile: z.object({
    name: looseText,
    rank: looseText,
    next_rank: looseText,
    current_rank_progress: looseNumber,
    points: looseNumber,
    user_owns: looseNumber,
    system_owns: looseNumber,
    joined_date: looseText,
  }),
});

export interface BasicProfile {
  username: string | null;
  rank: string | null;
  nextRank: string | null;
  /** Percent through the current rank toward `nextRank`. */
  rankProgress: number | null;
  points: number | null;
  userOwns: number | null;
  systemOwns: number | null;
  /** ISO date (YYYY-MM-DD) the account was created. */
  memberSince: string | null;
}

export function parseBasicProfile(json: unknown): BasicProfile | null {
  const parsed = basicProfileSchema.safeParse(json);
  if (!parsed.success) return null;
  const p = parsed.data.profile;
  const joined = p.joined_date ? /^(\d{4}-\d{2}-\d{2})/.exec(p.joined_date)?.[1] : undefined;
  return {
    username: p.name,
    rank: p.rank,
    nextRank: p.next_rank,
    // Progress only means something alongside a rank to progress toward.
    rankProgress: p.next_rank ? percent(p.current_rank_progress) : null,
    points: count(p.points),
    userOwns: count(p.user_owns),
    systemOwns: count(p.system_owns),
    memberSince: joined ?? null,
  };
}

// -----------------------------------------------------------------------------
// GET /user/profile/progress/{challenges|sherlocks}/{id} — same shape for both.

export const progressSchema = z.object({
  profile: z.object({
    solved_tasks: looseNumber,
    challenge_owns: z.object({ solved: looseNumber }).nullish(),
    challenge_categories: z
      .array(
        z.object({
          name: z.string().max(60),
          owned_flags: looseNumber,
          total_flags: looseNumber,
        }),
      )
      .max(100)
      .nullish(),
  }),
});

export interface FocusArea {
  name: string;
  kind: "Challenges" | "Sherlocks";
  owned: number;
  total: number;
  /** Completion of this category, 0–100. */
  percent: number;
}

export interface Progress {
  solved: number | null;
  /** Individual Sherlock questions answered (Sherlocks only). */
  tasks: number | null;
  /** Categories with at least one solve, most-solved first. */
  areas: FocusArea[];
}

export function parseProgress(json: unknown, kind: FocusArea["kind"]): Progress | null {
  const parsed = progressSchema.safeParse(json);
  if (!parsed.success) return null;
  const p = parsed.data.profile;

  const areas: FocusArea[] = [];
  for (const c of p.challenge_categories ?? []) {
    const owned = count(c.owned_flags);
    const total = count(c.total_flags);
    if (owned === null || total === null) continue;
    areas.push({
      name: c.name,
      kind,
      owned: Math.min(owned, total),
      total,
      percent: percent((owned / total) * 100) ?? 0,
    });
  }
  areas.sort((a, b) => b.owned - a.owned || b.percent - a.percent);

  return {
    solved: count(p.challenge_owns?.solved ?? null),
    tasks: kind === "Sherlocks" ? count(p.solved_tasks) : null,
    areas,
  };
}

/** Merges focus areas across sources, most-solved first, capped for layout. */
export function topFocusAreas(sources: (Progress | null)[], limit = 4): FocusArea[] {
  return sources
    .flatMap((source) => source?.areas ?? [])
    .sort((a, b) => b.owned - a.owned || b.percent - a.percent)
    .slice(0, limit);
}

import "server-only";

import { unstable_cache } from "next/cache";
import { createStaticClient } from "@repo/supabase/server";
import type {
  BlogPost,
  BlogPostSummary,
  CertificationSummary,
  EducationSummary,
  ExperienceSummary,
  Project,
  ProjectSummary,
} from "@repo/types";

/**
 * Cached, fail-soft content queries.
 *
 * Two jobs:
 *
 * 1. PERFORMANCE. A nonce-based CSP means the HTML must be rendered per
 *    request, so the one thing that must not happen per request is a round trip
 *    to Supabase. Every read below is wrapped in `unstable_cache`, which keeps
 *    the result in the Next data cache across requests and across the dynamic
 *    renders. Rendering stays dynamic; the database does not.
 *
 * 2. RESILIENCE. A portfolio must not 500 because a database is asleep, has
 *    been deleted, or is mid-incident. Every function degrades to empty data
 *    and logs once, so the site renders its shell either way.
 *
 * Cache invalidation is by tag: POST /api/revalidate (called by the admin
 * dashboard after every write), or a Supabase database webhook.
 */

export const CACHE_TAGS = {
  blogPosts: "blog-posts",
  projects: "projects",
  experience: "experience",
  education: "education",
  certifications: "certifications",
} as const;

/** Content changes rarely; an hour of staleness is imperceptible and cheap. */
const REVALIDATE_SECONDS = 3600;

/** Upper bound on rows so a runaway table cannot blow up a render. */
const MAX_ROWS = 200;

export interface QueryResult<T> {
  data: T;
  /** True when the read failed and `data` is the fallback, not the truth. */
  degraded: boolean;
}

/**
 * Runs a Supabase read, converting every failure mode into a value.
 *
 * supabase-js reports a bad query as `{ error }` but a DNS or TLS failure as a
 * thrown TypeError, so both are handled. A timeout is imposed because the
 * default fetch has none: without it, an unreachable database turns into a
 * request that hangs until the platform kills it.
 */
async function safeQuery<T>(
  label: string,
  run: (signal: AbortSignal) => PromiseLike<{ data: T | null; error: unknown }>,
  fallback: T,
  timeoutMs = 8000,
): Promise<QueryResult<T>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const { data, error } = await run(controller.signal);

    if (error) {
      console.error(`[supabase] ${label} failed:`, describeError(error));
      return { data: fallback, degraded: true };
    }
    if (data == null) {
      return { data: fallback, degraded: false };
    }
    return { data, degraded: false };
  } catch (error) {
    console.error(`[supabase] ${label} threw:`, describeError(error));
    return { data: fallback, degraded: true };
  } finally {
    clearTimeout(timer);
  }
}

/** Never logs the full error object — it can contain the request URL and key. */
function describeError(error: unknown): string {
  if (error && typeof error === "object") {
    const candidate = error as { message?: unknown; code?: unknown; name?: unknown };
    const parts = [candidate.code, candidate.name, candidate.message]
      .filter((part): part is string => typeof part === "string" && part.length > 0);
    if (parts.length) return parts.join(" / ").slice(0, 300);
  }
  return String(error).slice(0, 300);
}

/**
 * `unstable_cache` requires a function free of request-scoped APIs, which is
 * why these use `createStaticClient()` rather than the cookie-aware client.
 */
function cached<Args extends unknown[], T>(
  keyParts: string[],
  tags: string[],
  fn: (...args: Args) => Promise<T>,
) {
  return unstable_cache(fn, keyParts, { revalidate: REVALIDATE_SECONDS, tags });
}

// -----------------------------------------------------------------------------
// Blog
// -----------------------------------------------------------------------------

export const getBlogPosts = cached(
  ["blog-posts", "list"],
  [CACHE_TAGS.blogPosts],
  async (limit: number = MAX_ROWS): Promise<QueryResult<BlogPostSummary[]>> => {
    const supabase = createStaticClient();
    return safeQuery(
      "getBlogPosts",
      (signal) =>
        supabase
          .from("blog_posts")
          .select("id, slug, title, summary, date, tag, reading_minutes, created_at")
          .eq("published", true)
          .order("date", { ascending: false })
          .limit(Math.min(limit, MAX_ROWS))
          .abortSignal(signal),
      [],
    );
  },
);

export const getBlogPost = cached(
  ["blog-posts", "detail"],
  [CACHE_TAGS.blogPosts],
  async (slug: string): Promise<QueryResult<BlogPost | null>> => {
    const supabase = createStaticClient();
    return safeQuery(
      "getBlogPost",
      (signal) =>
        supabase
          .from("blog_posts")
          .select("*")
          .eq("slug", slug)
          .eq("published", true)
          .abortSignal(signal)
          // maybeSingle() returns null instead of erroring on zero rows, which
          // is the difference between a clean 404 and a logged failure.
          .maybeSingle(),
      null,
    );
  },
);

export const getBlogSlugs = cached(
  ["blog-posts", "slugs"],
  [CACHE_TAGS.blogPosts],
  async (): Promise<QueryResult<string[]>> => {
    const supabase = createStaticClient();
    const result = await safeQuery(
      "getBlogSlugs",
      (signal) =>
        supabase
          .from("blog_posts")
          .select("slug")
          .eq("published", true)
          .limit(MAX_ROWS)
          .abortSignal(signal),
      [],
    );
    return { data: result.data.map((row) => row.slug), degraded: result.degraded };
  },
);

// -----------------------------------------------------------------------------
// Projects
// -----------------------------------------------------------------------------

export const getProjects = cached(
  ["projects", "list"],
  [CACHE_TAGS.projects],
  async (limit: number = MAX_ROWS): Promise<QueryResult<ProjectSummary[]>> => {
    const supabase = createStaticClient();
    return safeQuery(
      "getProjects",
      (signal) =>
        supabase
          .from("projects")
          .select("id, title, description, category, status, tags, link, sort_order, created_at")
          .eq("published", true)
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: false })
          .limit(Math.min(limit, MAX_ROWS))
          .abortSignal(signal),
      [],
    );
  },
);

export const getProject = cached(
  ["projects", "detail"],
  [CACHE_TAGS.projects],
  async (id: string): Promise<QueryResult<Project | null>> => {
    const supabase = createStaticClient();
    return safeQuery(
      "getProject",
      (signal) =>
        supabase
          .from("projects")
          .select("*")
          .eq("id", id)
          .eq("published", true)
          .abortSignal(signal)
          .maybeSingle(),
      null,
    );
  },
);

export const getProjectIds = cached(
  ["projects", "ids"],
  [CACHE_TAGS.projects],
  async (): Promise<QueryResult<string[]>> => {
    const supabase = createStaticClient();
    const result = await safeQuery(
      "getProjectIds",
      (signal) =>
        supabase
          .from("projects")
          .select("id")
          .eq("published", true)
          .limit(MAX_ROWS)
          .abortSignal(signal),
      [],
    );
    return { data: result.data.map((row) => row.id), degraded: result.degraded };
  },
);

// -----------------------------------------------------------------------------
// Experience, education, certifications
// -----------------------------------------------------------------------------

export const getExperience = cached(
  ["experience", "list"],
  [CACHE_TAGS.experience],
  async (): Promise<QueryResult<ExperienceSummary[]>> => {
    const supabase = createStaticClient();
    return safeQuery(
      "getExperience",
      (signal) =>
        supabase
          .from("experience")
          .select("id, period, role, company, description, sort_order")
          .eq("published", true)
          .order("sort_order", { ascending: true })
          .order("id", { ascending: true })
          .limit(MAX_ROWS)
          .abortSignal(signal),
      [],
    );
  },
);

export const getEducation = cached(
  ["education", "list"],
  [CACHE_TAGS.education],
  async (): Promise<QueryResult<EducationSummary[]>> => {
    const supabase = createStaticClient();
    return safeQuery(
      "getEducation",
      (signal) =>
        supabase
          .from("education")
          .select("id, degree, period, school, details, sort_order")
          .eq("published", true)
          .order("sort_order", { ascending: true })
          .order("id", { ascending: true })
          .limit(MAX_ROWS)
          .abortSignal(signal),
      [],
    );
  },
);

export const getCertifications = cached(
  ["certifications", "list"],
  [CACHE_TAGS.certifications],
  async (): Promise<QueryResult<CertificationSummary[]>> => {
    const supabase = createStaticClient();
    return safeQuery(
      "getCertifications",
      (signal) =>
        supabase
          .from("certifications")
          .select("id, name, file_url, issuer, issued_on, sort_order, created_at")
          .eq("published", true)
          .order("sort_order", { ascending: true })
          .order("id", { ascending: true })
          .limit(MAX_ROWS)
          .abortSignal(signal),
      [],
    );
  },
);

/**
 * Everything the home page needs, in one parallel fan-out.
 *
 * Sequential awaits here would serialise four independent round trips on a cold
 * cache; `Promise.all` makes the cold path as fast as its slowest query.
 */
export async function getHomePageData() {
  const [posts, projects, experience, education] = await Promise.all([
    getBlogPosts(3),
    getProjects(3),
    getExperience(),
    getEducation(),
  ]);

  return {
    posts: posts.data,
    projects: projects.data,
    experience: experience.data,
    education: education.data,
    degraded:
      posts.degraded || projects.degraded || experience.degraded || education.degraded,
  };
}

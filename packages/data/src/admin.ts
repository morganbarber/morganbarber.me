import "server-only";

import { createAdminClient } from "@repo/supabase/admin";
import type {
  Analytics,
  BlogPost,
  Certification,
  ContactMessage,
  Education,
  Experience,
  Project,
} from "@repo/types";
import type { EditableTable } from "./schemas";

/**
 * Privileged data access for the local admin dashboard.
 *
 * Uses the service-role client, so RLS does not apply — which is the point:
 * these reads must see unpublished drafts, and these writes must reach tables
 * the public key cannot touch at all.
 *
 * Every function here is server-only and is never imported by apps/portfolio.
 */

export interface AdminResult<T> {
  data: T | null;
  error: string | null;
}

/**
 * Normalises a Supabase failure into a message a human can act on.
 *
 * PostgREST returns constraint violations as opaque codes; mapping the ones
 * that are actually reachable from the forms turns "23505" into "something with
 * that slug already exists".
 */
function describeError(error: unknown): string {
  if (!error || typeof error !== "object") return String(error);

  const candidate = error as { code?: string; message?: string; details?: string };

  switch (candidate.code) {
    case "23505":
      return "A record with that unique value already exists (check the slug or ID).";
    case "23514":
      return `A database constraint rejected this value: ${candidate.details ?? candidate.message ?? ""}`.trim();
    case "23503":
      return "That record is referenced elsewhere and cannot be removed.";
    case "42501":
      return "Permission denied. Check that SUPABASE_SERVICE_ROLE_KEY is the service-role key.";
    case "PGRST116":
      return "Record not found.";
    default:
      return candidate.message ?? "Unknown database error.";
  }
}

async function run<T>(
  operation: () => PromiseLike<{ data: T | null; error: unknown }>,
): Promise<AdminResult<T>> {
  try {
    const { data, error } = await operation();
    if (error) return { data: null, error: describeError(error) };
    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// -----------------------------------------------------------------------------
// Reads — unlike the public queries, these include unpublished rows
// -----------------------------------------------------------------------------

export async function listBlogPosts(): Promise<AdminResult<BlogPost[]>> {
  return run(() =>
    createAdminClient().from("blog_posts").select("*").order("created_at", { ascending: false }),
  );
}

export async function getBlogPost(id: number): Promise<AdminResult<BlogPost>> {
  return run(() => createAdminClient().from("blog_posts").select("*").eq("id", id).maybeSingle());
}

export async function listProjects(): Promise<AdminResult<Project[]>> {
  return run(() =>
    createAdminClient()
      .from("projects")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false }),
  );
}

export async function getProject(id: string): Promise<AdminResult<Project>> {
  return run(() => createAdminClient().from("projects").select("*").eq("id", id).maybeSingle());
}

export async function listExperience(): Promise<AdminResult<Experience[]>> {
  return run(() =>
    createAdminClient()
      .from("experience")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true }),
  );
}

export async function getExperience(id: number): Promise<AdminResult<Experience>> {
  return run(() => createAdminClient().from("experience").select("*").eq("id", id).maybeSingle());
}

export async function listEducation(): Promise<AdminResult<Education[]>> {
  return run(() =>
    createAdminClient()
      .from("education")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true }),
  );
}

export async function getEducation(id: number): Promise<AdminResult<Education>> {
  return run(() => createAdminClient().from("education").select("*").eq("id", id).maybeSingle());
}

export async function listCertifications(): Promise<AdminResult<Certification[]>> {
  return run(() =>
    createAdminClient()
      .from("certifications")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true }),
  );
}

export async function getCertification(id: number): Promise<AdminResult<Certification>> {
  return run(() =>
    createAdminClient().from("certifications").select("*").eq("id", id).maybeSingle(),
  );
}

// -----------------------------------------------------------------------------
// Writes
// -----------------------------------------------------------------------------

/**
 * `values` is typed loosely because the caller has already validated it against
 * the matching Zod schema in ./schemas — the shapes are generated from those,
 * and re-deriving the union per table here would add ceremony without adding
 * any checking the schema does not already do.
 */
type Row = Record<string, unknown>;

/**
 * Widens the query builder for a table chosen at runtime.
 *
 * supabase-js derives the row type from the *literal* table name, so it cannot
 * narrow when the name is a runtime union member. Rather than repeat an
 * assertion at each call site, the widening happens once here and is documented
 * once: the real guarantee is upstream, where the caller has already validated
 * `values` against the Zod schema that mirrors the table's SQL constraints.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function looseTable(table: EditableTable): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createAdminClient().from(table) as any;
}

export async function createRow(table: EditableTable, values: Row): Promise<AdminResult<Row>> {
  return run(() => looseTable(table).insert(values).select().maybeSingle());
}

export async function updateRow(
  table: EditableTable,
  id: string | number,
  values: Row,
): Promise<AdminResult<Row>> {
  return run(() => looseTable(table).update(values).eq("id", id).select().maybeSingle());
}

export async function deleteRow(
  table: EditableTable,
  id: string | number,
): Promise<AdminResult<null>> {
  return run(() => looseTable(table).delete().eq("id", id));
}

export async function setPublished(
  table: EditableTable,
  id: string | number,
  published: boolean,
): Promise<AdminResult<Row>> {
  return updateRow(table, id, { published });
}

// -----------------------------------------------------------------------------
// Analytics & contact inbox — readable only with the service-role key
// -----------------------------------------------------------------------------

export interface AnalyticsSummary {
  totalViews: number;
  uniqueVisitors: number;
  viewsLast7Days: number;
  topPaths: { path: string; views: number }[];
  topReferrers: { host: string; views: number }[];
  byDevice: { device: string; views: number }[];
  byDay: { day: string; views: number }[];
  recent: Analytics[];
}

/**
 * Builds the dashboard summary from one query.
 *
 * Aggregating in JavaScript rather than issuing six grouped queries: PostgREST
 * has no GROUP BY, so the alternative is six round trips or a set of database
 * views. At this table size one capped read is simpler and faster, and the cap
 * is what keeps it bounded as the table grows.
 */
export async function getAnalyticsSummary(days = 30): Promise<AdminResult<AnalyticsSummary>> {
  const since = new Date(Date.now() - days * 86_400_000).toISOString();

  const result = await run<Analytics[]>(() =>
    createAdminClient()
      .from("analytics")
      .select("*")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(10_000),
  );

  if (result.error) return { data: null, error: result.error };
  const rows = result.data ?? [];

  const tally = (values: (string | null)[]) => {
    const counts = new Map<string, number>();
    for (const value of values) {
      if (!value) continue;
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  };

  const sevenDaysAgo = Date.now() - 7 * 86_400_000;

  return {
    data: {
      totalViews: rows.length,
      uniqueVisitors: new Set(
        rows.map((row) => row.visitor_hash).filter((hash): hash is string => Boolean(hash)),
      ).size,
      viewsLast7Days: rows.filter((row) => new Date(row.created_at).getTime() >= sevenDaysAgo)
        .length,
      topPaths: tally(rows.map((row) => row.path))
        .slice(0, 12)
        .map(([path, views]) => ({ path, views })),
      topReferrers: tally(rows.map((row) => row.referrer_host))
        .slice(0, 10)
        .map(([host, views]) => ({ host, views })),
      byDevice: tally(rows.map((row) => row.device_type)).map(([device, views]) => ({
        device,
        views,
      })),
      byDay: tally(rows.map((row) => row.created_at.slice(0, 10)))
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([day, views]) => ({ day, views })),
      recent: rows.slice(0, 50),
    },
    error: null,
  };
}

export async function listContactMessages(): Promise<AdminResult<ContactMessage[]>> {
  return run(() =>
    createAdminClient()
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500),
  );
}

export async function setContactStatus(
  id: string,
  status: ContactMessage["status"],
): Promise<AdminResult<Row>> {
  return run(() =>
    createAdminClient()
      .from("contact_messages")
      .update({ status })
      .eq("id", id)
      .select()
      .maybeSingle(),
  );
}

export async function deleteContactMessage(id: string): Promise<AdminResult<null>> {
  return run(() => createAdminClient().from("contact_messages").delete().eq("id", id));
}

/** Row counts for the dashboard landing page. */
export async function getContentCounts(): Promise<
  AdminResult<Record<string, { total: number; published: number }>>
> {
  const tables: EditableTable[] = [
    "blog_posts",
    "projects",
    "experience",
    "education",
    "certifications",
  ];

  try {
    // Inside the try: createAdminClient() throws when the service-role key is
    // missing, and that must surface as a message, not a 500.
    const supabase = createAdminClient();

    const entries = await Promise.all(
      tables.map(async (table) => {
        const [all, live] = await Promise.all([
          supabase.from(table).select("*", { count: "exact", head: true }),
          supabase.from(table).select("*", { count: "exact", head: true }).eq("published", true),
        ]);
        return [table, { total: all.count ?? 0, published: live.count ?? 0 }] as const;
      }),
    );
    return { data: Object.fromEntries(entries), error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : String(error) };
  }
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { TriangleAlert, ArrowRight, Eye, EyeOff, Inbox } from "lucide-react";
import { getContentCounts, listContactMessages } from "@repo/data/admin";
import { hasServiceRoleKey } from "@repo/config/server-env";
import { isAuthenticated } from "@/lib/auth";
import { RESOURCES } from "@/lib/resources";
import Shell from "@/components/shell";
import SetupRequired from "@/components/setup-required";

export const dynamic = "force-dynamic";

/**
 * Dashboard overview: what exists, what is published, what needs attention.
 *
 * The draft counts are the point. "Published 3 of 5" is the number that
 * explains why something written last week is not on the site.
 */
export default async function DashboardPage() {
  if (!(await isAuthenticated())) redirect("/login");

  // Without the service-role key nothing here can load; show the setup steps
  // once instead of the same failure repeated in every card.
  if (!hasServiceRoleKey()) return <SetupRequired />;

  const [counts, messages] = await Promise.all([getContentCounts(), listContactMessages()]);

  const unread = (messages.data ?? []).filter((message) => message.status === "new");
  const error = counts.error ?? messages.error;

  return (
    <Shell
      title="Dashboard"
      description="Everything on morganbarber.me, editable from here. Changes go live immediately."
    >
      {error ? (
        <div className="mb-6 flex items-start gap-2 rounded border border-danger/40 bg-danger/5 px-4 py-3 text-danger">
          <TriangleAlert className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-bold">Could not reach the database</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {RESOURCES.map((resource) => {
          const stat = counts.data?.[resource.table];
          const drafts = stat ? stat.total - stat.published : 0;

          return (
            <Link
              key={resource.slug}
              href={`/content/${resource.slug}`}
              className="group rounded border border-border bg-surface p-5 hover:border-primary transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-bold">{resource.label}</h2>
                <ArrowRight
                  className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0"
                  aria-hidden="true"
                />
              </div>

              <p className="mt-3 text-3xl font-bold tabular-nums">{stat?.total ?? "—"}</p>

              <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Eye className="h-3 w-3" aria-hidden="true" />
                  {stat?.published ?? 0} live
                </span>
                {drafts > 0 ? (
                  <span className="inline-flex items-center gap-1 text-primary">
                    <EyeOff className="h-3 w-3" aria-hidden="true" />
                    {drafts} draft{drafts === 1 ? "" : "s"}
                  </span>
                ) : null}
              </div>
            </Link>
          );
        })}

        <Link
          href="/messages"
          className="group rounded border border-border bg-surface p-5 hover:border-primary transition-colors"
        >
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-bold">Messages</h2>
            <Inbox
              className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0"
              aria-hidden="true"
            />
          </div>

          <p className="mt-3 text-3xl font-bold tabular-nums">{messages.data?.length ?? "—"}</p>

          <div className="mt-2 text-xs text-muted-foreground">
            {unread.length > 0 ? (
              <span className="text-primary">{unread.length} unread</span>
            ) : (
              <span>No unread messages</span>
            )}
          </div>
        </Link>
      </div>

      <section className="mt-10">
        <h2 className="font-bold mb-3">How publishing works</h2>
        <ul className="space-y-2 text-muted-foreground max-w-2xl list-none p-0">
          <li className="flex gap-2">
            <span className="text-primary shrink-0">&gt;</span>
            New blog posts and projects are created{" "}
            <strong className="text-foreground">unpublished</strong>. They stay invisible to
            visitors until you tick Published.
          </li>
          <li className="flex gap-2">
            <span className="text-primary shrink-0">&gt;</span>
            The public site caches content for an hour. Saving here refreshes it straight away,
            provided <code className="text-foreground">PORTFOLIO_URL</code> and{" "}
            <code className="text-foreground">REVALIDATE_SECRET</code> are set.
          </li>
          <li className="flex gap-2">
            <span className="text-primary shrink-0">&gt;</span>
            Post and project content is rendered as plain text, never HTML — a stray tag shows as
            text instead of becoming a script.
          </li>
        </ul>
      </section>
    </Shell>
  );
}

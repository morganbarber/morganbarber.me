import { redirect } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { getAnalyticsSummary } from "@repo/data/admin";
import { isAuthenticated } from "@/lib/auth";
import Shell from "@/components/shell";

export const dynamic = "force-dynamic";

/**
 * Traffic overview for the last 30 days.
 *
 * Readable only here: the `analytics` table has no grants for the public key,
 * so the service-role client in the admin app is the only way to see it.
 *
 * Charts are plain CSS bars rather than a charting library. For a handful of
 * series it renders instantly, adds no dependency, and needs no client JS —
 * this whole page ships zero bytes of JavaScript.
 */
export default async function AnalyticsPage() {
  if (!(await isAuthenticated())) redirect("/login");

  const { data, error } = await getAnalyticsSummary(30);

  return (
    <Shell
      title="Analytics"
      description="Last 30 days. Visitors are counted by a salted hash of their IP — no raw addresses are ever stored."
    >
      {error ? (
        <div className="flex items-start gap-2 rounded border border-danger/40 bg-danger/5 px-4 py-3 text-danger">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      ) : !data ? null : (
        <div className="space-y-10">
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat label="Page views (30d)" value={data.totalViews} />
            <Stat label="Unique visitors (30d)" value={data.uniqueVisitors} />
            <Stat label="Page views (7d)" value={data.viewsLast7Days} />
          </div>

          {data.totalViews === 0 ? (
            <p className="rounded border border-border bg-surface p-10 text-center text-muted-foreground">
              No traffic recorded yet. Visits are tracked once the site is running and the visitor
              has not enabled Do Not Track.
            </p>
          ) : (
            <>
              <BarList
                title="Most visited pages"
                rows={data.topPaths.map((row) => ({ label: row.path, value: row.views }))}
              />

              <BarList
                title="Top referrers"
                rows={data.topReferrers.map((row) => ({ label: row.host, value: row.views }))}
                emptyMessage="No external referrers — all traffic arrived directly."
              />

              <BarList
                title="Devices"
                rows={data.byDevice.map((row) => ({ label: row.device, value: row.views }))}
              />

              <section>
                <h2 className="font-bold mb-3">Recent activity</h2>
                <div className="overflow-x-auto rounded border border-border">
                  <table className="w-full border-collapse text-left">
                    <thead className="bg-surface">
                      <tr>
                        <th scope="col" className="px-4 py-2.5 border-b border-border">
                          When
                        </th>
                        <th scope="col" className="px-4 py-2.5 border-b border-border">
                          Path
                        </th>
                        <th scope="col" className="px-4 py-2.5 border-b border-border">
                          Device
                        </th>
                        <th scope="col" className="px-4 py-2.5 border-b border-border">
                          Browser
                        </th>
                        <th scope="col" className="px-4 py-2.5 border-b border-border">
                          Country
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recent.slice(0, 25).map((row) => (
                        <tr key={row.id} className="border-b border-border last:border-b-0">
                          <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
                            {new Date(row.created_at).toLocaleString()}
                          </td>
                          <td className="px-4 py-2.5">{row.path}</td>
                          <td className="px-4 py-2.5 text-muted-foreground">
                            {row.device_type ?? "—"}
                          </td>
                          <td className="px-4 py-2.5 text-muted-foreground">
                            {row.browser ?? "—"}
                          </td>
                          <td className="px-4 py-2.5 text-muted-foreground">
                            {row.geo_country ?? "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
        </div>
      )}
    </Shell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border border-border bg-surface p-5">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-bold tabular-nums">{value.toLocaleString()}</p>
    </div>
  );
}

function BarList({
  title,
  rows,
  emptyMessage = "Nothing recorded.",
}: {
  title: string;
  rows: { label: string; value: number }[];
  emptyMessage?: string;
}) {
  // Scale against the largest row so the longest bar always fills the track;
  // guard against an empty list so the division cannot be by zero.
  const max = rows.reduce((peak, row) => Math.max(peak, row.value), 0) || 1;

  return (
    <section>
      <h2 className="font-bold mb-3">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-muted-foreground">{emptyMessage}</p>
      ) : (
        <ul className="space-y-1.5 list-none m-0 p-0">
          {rows.map((row) => (
            <li key={row.label} className="flex items-center gap-3">
              <span className="w-56 shrink-0 truncate" title={row.label}>
                {row.label}
              </span>
              <span className="relative flex-1 h-5 rounded bg-muted overflow-hidden">
                <span
                  className="absolute inset-y-0 left-0 bg-primary/30 border-r-2 border-primary"
                  style={{ width: `${Math.max(2, (row.value / max) * 100)}%` }}
                />
              </span>
              <span className="w-14 shrink-0 text-right tabular-nums text-muted-foreground">
                {row.value.toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

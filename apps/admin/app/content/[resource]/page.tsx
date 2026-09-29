import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { TriangleAlert, ExternalLink, Plus } from "lucide-react";
import {
  listBlogPosts,
  listCertifications,
  listCompetitions,
  listEducation,
  listExperience,
  listProjects,
  type AdminResult,
} from "@repo/data/admin";
import { isAuthenticated } from "@/lib/auth";
import { getResource, RESOURCE_SLUGS, type ResourceDef } from "@/lib/resources";
import Shell from "@/components/shell";
import PublishToggle from "@/components/publish-toggle";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  return RESOURCE_SLUGS.map((resource) => ({ resource }));
}

/** Maps a resource to its list query. Kept explicit so each stays typed. */
async function loadRows(resource: ResourceDef): Promise<AdminResult<Record<string, unknown>[]>> {
  switch (resource.table) {
    case "blog_posts":
      return listBlogPosts() as unknown as Promise<AdminResult<Record<string, unknown>[]>>;
    case "projects":
      return listProjects() as unknown as Promise<AdminResult<Record<string, unknown>[]>>;
    case "experience":
      return listExperience() as unknown as Promise<AdminResult<Record<string, unknown>[]>>;
    case "education":
      return listEducation() as unknown as Promise<AdminResult<Record<string, unknown>[]>>;
    case "certifications":
      return listCertifications() as unknown as Promise<AdminResult<Record<string, unknown>[]>>;
    case "competitions":
      return listCompetitions() as unknown as Promise<AdminResult<Record<string, unknown>[]>>;
  }
}

export default async function ResourceListPage({
  params,
}: {
  params: Promise<{ resource: string }>;
}) {
  if (!(await isAuthenticated())) redirect("/login");

  const { resource: slug } = await params;
  const resource = getResource(slug);
  if (!resource) notFound();

  const { data: rows, error } = await loadRows(resource);
  const portfolioUrl = process.env.PORTFOLIO_URL ?? "http://localhost:3000";

  return (
    <Shell
      title={resource.label}
      description={resource.description}
      actions={
        <Link href={`/content/${slug}/new`} className="btn btn-primary">
          <Plus className="size-4" aria-hidden="true" />
          New {resource.singular.toLowerCase()}
        </Link>
      }
    >
      {error ? (
        <div className="alert alert-danger">
          <TriangleAlert className="size-4 mt-0.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      ) : !rows || rows.length === 0 ? (
        <div className="rounded border border-border bg-surface p-10 text-center">
          <p className="text-muted-foreground">Nothing here yet.</p>
          <Link
            href={`/content/${slug}/new`}
            className="inline-flex items-center gap-2 mt-4 text-primary hover:underline"
          >
            <Plus className="size-4" aria-hidden="true" />
            Create the first one
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded border border-border">
          <table className="w-full border-collapse text-left">
            <thead className="bg-surface">
              <tr>
                {resource.listColumns.map((column) => (
                  <th
                    key={column.field}
                    scope="col"
                    className="px-4 py-3 font-bold border-b border-border whitespace-nowrap"
                  >
                    {column.label}
                  </th>
                ))}
                <th scope="col" className="px-4 py-3 font-bold border-b border-border">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 font-bold border-b border-border text-right">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row) => {
                const id = String(row[resource.idField]);
                const published = Boolean(row.published);
                const livePath = resource.publicPath?.(row);

                return (
                  <tr
                    key={id}
                    className="border-b border-border last:border-b-0 hover:bg-surface/60"
                  >
                    {resource.listColumns.map((column) => {
                      const value = row[column.field];
                      const display =
                        value === null || value === undefined || value === "" ? "—" : String(value);

                      return (
                        <td key={column.field} className="px-4 py-3 align-top">
                          {column.primary ? (
                            <Link
                              href={`/content/${slug}/${encodeURIComponent(id)}`}
                              className="font-bold hover:text-primary transition-colors"
                            >
                              {display}
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">{display}</span>
                          )}
                        </td>
                      );
                    })}

                    <td className="px-4 py-3 align-top">
                      <PublishToggle slug={slug} id={id} published={published} />
                    </td>

                    <td className="px-4 py-3 align-top text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-3">
                        {published && livePath ? (
                          <a
                            href={`${portfolioUrl}${livePath}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary transition-colors"
                            title="View on the site"
                          >
                            <ExternalLink className="size-4" aria-hidden="true" />
                            <span className="sr-only">View on the site</span>
                          </a>
                        ) : null}
                        <Link
                          href={`/content/${slug}/${encodeURIComponent(id)}`}
                          className="text-primary hover:underline"
                        >
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Shell>
  );
}

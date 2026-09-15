import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ExternalLink } from "lucide-react";
import {
  getBlogPost,
  getCertification,
  getEducation,
  getExperience,
  getProject,
  type AdminResult,
} from "@repo/data/admin";
import { isAuthenticated } from "@/lib/auth";
import { getResource, type ResourceDef } from "@/lib/resources";
import Shell from "@/components/shell";
import ResourceForm from "@/components/resource-form";
import DeleteButton from "@/components/delete-button";

export const dynamic = "force-dynamic";

async function loadRow(
  resource: ResourceDef,
  id: string,
): Promise<AdminResult<Record<string, unknown>>> {
  // The numeric tables use a bigint primary key; `projects` uses a text id.
  const numericId = Number(id);
  const asRecord = (p: Promise<AdminResult<unknown>>) =>
    p as unknown as Promise<AdminResult<Record<string, unknown>>>;

  switch (resource.table) {
    case "projects":
      return asRecord(getProject(id));
    case "blog_posts":
      return Number.isFinite(numericId)
        ? asRecord(getBlogPost(numericId))
        : { data: null, error: "Invalid id" };
    case "experience":
      return Number.isFinite(numericId)
        ? asRecord(getExperience(numericId))
        : { data: null, error: "Invalid id" };
    case "education":
      return Number.isFinite(numericId)
        ? asRecord(getEducation(numericId))
        : { data: null, error: "Invalid id" };
    case "certifications":
      return Number.isFinite(numericId)
        ? asRecord(getCertification(numericId))
        : { data: null, error: "Invalid id" };
  }
}

export default async function EditResourcePage({
  params,
}: {
  params: Promise<{ resource: string; id: string }>;
}) {
  if (!(await isAuthenticated())) redirect("/login");

  const { resource: slug, id } = await params;
  const resource = getResource(slug);
  if (!resource) notFound();

  const { data: row, error } = await loadRow(resource, id);
  if (error) throw new Error(error);
  if (!row) notFound();

  const { schema: _schema, publicPath, ...serialisable } = resource;
  const livePath = publicPath?.(row);
  const portfolioUrl = process.env.PORTFOLIO_URL ?? "http://localhost:3000";

  return (
    <Shell
      title={`Edit ${resource.singular.toLowerCase()}`}
      description={resource.description}
      actions={
        <>
          {row.published && livePath ? (
            <a
              href={`${portfolioUrl}${livePath}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded border border-border px-3 py-2 text-muted-foreground hover:text-primary hover:border-primary transition-colors"
            >
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              View live
            </a>
          ) : null}
          <DeleteButton slug={slug} id={id} label={resource.singular.toLowerCase()} />
        </>
      }
    >
      <ResourceForm resource={serialisable} row={row} id={id} />

      <p className="mt-8 text-xs text-muted-foreground">
        <Link href={`/content/${slug}`} className="hover:text-foreground">
          ← All {resource.label.toLowerCase()}
        </Link>
      </p>
    </Shell>
  );
}

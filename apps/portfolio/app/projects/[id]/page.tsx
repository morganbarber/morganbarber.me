import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import MagneticButton from "@repo/ui/magnetic-button";
import { getProject, getProjectIds } from "@repo/data/content";
import Prose from "@/components/prose";
import Breadcrumbs from "@/components/breadcrumbs";
import StructuredData from "@/components/structured-data";
import { pageMetadata, readableTitle } from "@/lib/seo";
import { breadcrumbNode, graph, projectNode } from "@/lib/structured-data";
import { isSafeExternalUrl } from "@repo/security/url";

type Props = {
  params: Promise<{ id: string }>;
};

/** Mirrors the `projects_id_format` CHECK constraint. */
const ID_PATTERN = /^[a-zA-Z0-9]+(?:[-_][a-zA-Z0-9]+)*$/;

export async function generateStaticParams() {
  const { data: ids } = await getProjectIds();
  return ids.map((id) => ({ id }));
}

/**
 * Project descriptions are written as one-liners for the listing ("A network
 * intrusion detection system built with Python and Scapy." — 65 characters),
 * which is half the length Google shows in a snippet. The remaining space is
 * filled with facts already on the page: the category, the author and the
 * stack, all words someone might actually search for.
 */
function projectDescription(project: { description: string; category: string; tags: string[] }) {
  const base = project.description.trim().replace(/\.?$/, ".");
  if (base.length >= 120) return base;
  const stack = project.tags
    .slice(0, 4)
    .map((t) => readableTitle(t))
    .join(", ");
  return `${base} A ${readableTitle(project.category).toLowerCase()} project by Morgan Barber${
    stack ? ` using ${stack}` : ""
  }, with a write-up and source code.`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  if (!ID_PATTERN.test(id)) return { title: "Project Not Found", robots: { index: false } };

  const { data: project } = await getProject(id);
  if (!project) return { title: "Project Not Found", robots: { index: false } };

  const title = readableTitle(project.title);
  return pageMetadata({
    // "Project Orion — Network Security Project" says what it is in results,
    // where a bare codename does not.
    title: `${title} — ${readableTitle(project.category)} Project`,
    description: projectDescription(project),
    path: `/projects/${project.id}`,
    type: "article",
    ownImage: true,
    publishedTime: project.created_at,
    modifiedTime: project.updated_at,
    tags: project.tags,
  });
}

export default async function ProjectPage({ params }: Props) {
  const { id } = await params;
  if (!ID_PATTERN.test(id)) notFound();

  const { data: project } = await getProject(id);
  if (!project) notFound();

  // The database CHECK already restricts this to http(s), but the link is
  // re-validated before it becomes an href. Two cheap checks beat one.
  const safeLink = isSafeExternalUrl(project.link) ? project.link : null;

  return (
    <main className="min-h-screen pt-32 pb-24 px-6 max-w-3xl mx-auto">
      <StructuredData
        data={graph(
          projectNode(project),
          breadcrumbNode([
            { name: "Home", path: "/" },
            { name: "Projects", path: "/projects" },
            { name: readableTitle(project.title), path: `/projects/${project.id}` },
          ]),
        )}
      />

      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Projects", href: "/projects" },
          { name: readableTitle(project.title) },
        ]}
      />

      <article>
        <header className="mb-10 border-b border-muted pb-8">
          <div className="flex flex-wrap items-center gap-4 text-sm font-mono text-primary mb-6">
            <span className="text-muted-foreground">
              {"// "}
              {project.id}
            </span>
            <span className="px-2 py-1 bg-primary/10 rounded text-xs">{project.category}</span>
            <span className="px-2 py-1 border border-muted rounded text-xs text-muted-foreground">
              {project.status}
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold uppercase leading-tight mb-6">
            {project.title}
          </h1>

          <p className="text-xl text-muted-foreground leading-relaxed mb-8">
            {project.description}
          </p>

          {project.tags.length > 0 ? (
            <ul className="flex flex-wrap gap-2 mb-8 list-none p-0">
              {project.tags.map((tag) => (
                <li
                  key={tag}
                  className="text-xs font-mono border border-primary/30 px-2 py-1 rounded text-primary/80"
                >
                  {tag}
                </li>
              ))}
            </ul>
          ) : null}

          {safeLink ? (
            <a
              href={safeLink}
              target="_blank"
              /* noopener severs window.opener; noreferrer also withholds the
                 referring URL from the destination. */
              rel="noopener noreferrer external"
              className="inline-block"
            >
              <MagneticButton>
                <span className="flex items-center gap-2">
                  VIEW CODE <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </span>
              </MagneticButton>
            </a>
          ) : null}
        </header>

        <h2 className="text-2xl font-bold text-foreground mb-4 uppercase">Project Overview</h2>
        <Prose content={project.content} />
      </article>
    </main>
  );
}

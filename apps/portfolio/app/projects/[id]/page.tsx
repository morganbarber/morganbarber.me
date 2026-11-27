import type { Metadata } from "next";
import { notFound } from "next/navigation";
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
    <main className="shell max-w-5xl pt-32 pb-32 md:pt-40">
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
        <header className="mb-16 border-b border-line pb-12">
          <div className="mb-8 flex flex-wrap items-center gap-3 font-mono text-xs">
            <span className="text-muted-foreground">project {project.id}</span>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">
              {project.category.toLowerCase()}
            </span>
            <span className="rounded-full border border-line px-3 py-1 text-muted-foreground">
              {project.status.toLowerCase()}
            </span>
          </div>

          <h1
            data-split="chars"
            className="font-display text-[clamp(3rem,9vw,7.5rem)] leading-[0.88]"
          >
            {project.title}
          </h1>

          <p data-reveal className="mt-10 max-w-2xl text-xl leading-relaxed text-muted-foreground">
            {project.description}
          </p>

          <div data-reveal className="mt-10 flex flex-wrap items-center gap-6">
            {safeLink ? (
              <a
                href={safeLink}
                target="_blank"
                /* noopener severs window.opener; noreferrer also withholds the
                   referring URL from the destination. */
                rel="noopener noreferrer external"
                className="btn btn-primary"
              >
                View code <span aria-hidden="true">↗</span>
              </a>
            ) : null}
            {project.tags.length > 0 ? (
              <ul className="flex list-none flex-wrap gap-2 p-0">
                {project.tags.map((tag) => (
                  <li
                    key={tag}
                    className="rounded-full border border-line px-3 py-1 font-mono text-xs text-muted-foreground"
                  >
                    {tag.toLowerCase()}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </header>

        <div className="grid gap-10 md:grid-cols-[12rem_minmax(0,1fr)]">
          <h2 className="label">project overview</h2>
          <div data-reveal>
            <Prose content={project.content} />
          </div>
        </div>
      </article>
    </main>
  );
}

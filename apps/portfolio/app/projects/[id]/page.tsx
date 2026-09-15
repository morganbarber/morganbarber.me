import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import MagneticButton from "@repo/ui/magnetic-button";
import { getProject, getProjectIds } from "@repo/data/content";
import { getSiteUrl } from "@repo/config/env";
import Prose from "@/components/prose";
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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  if (!ID_PATTERN.test(id)) return { title: "Project Not Found" };

  const { data: project } = await getProject(id);
  if (!project) return { title: "Project Not Found", robots: { index: false } };

  const url = `${getSiteUrl()}/projects/${project.id}`;

  return {
    title: project.title,
    description: project.description,
    alternates: { canonical: url },
    openGraph: {
      title: project.title,
      description: project.description,
      type: "article",
      url,
    },
    twitter: {
      card: "summary_large_image",
      title: project.title,
      description: project.description,
    },
  };
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
      <Link
        href="/projects"
        className="inline-flex items-center text-muted-foreground hover:text-primary mb-8 transition-colors focus-visible:outline-2 focus-visible:outline-primary"
      >
        <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" /> BACK TO PROJECTS
      </Link>

      <article>
        <header className="mb-10 border-b border-muted pb-8">
          <div className="flex flex-wrap items-center gap-4 text-sm font-mono text-primary mb-6">
            <span className="text-muted-foreground">{"// "}{project.id}</span>
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

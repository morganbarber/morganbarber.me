import type { MetadataRoute } from "next";
import { getBlogPosts, getProjects } from "@repo/data/content";
import { absoluteUrl } from "@/lib/seo";

/**
 * Dynamic sitemap.
 *
 * `lastModified` reflects when content actually changed. The previous version
 * stamped every static route with `new Date()` — "modified just now" on every
 * fetch — and Google's documentation is explicit that it ignores lastmod from
 * sites where the value is not consistently accurate. An accurate value is
 * what gets an edited post re-crawled quickly; a constantly-fresh one gets
 * every value ignored.
 *
 * Index pages take the newest date among the items they list. Pages whose
 * content lives in code (about, contact) omit lastmod rather than invent one.
 *
 * Only published rows appear: the queries filter on `published = true`, which
 * keeps drafts out of search engines.
 */
export const revalidate = 3600;

function latest(dates: string[]): Date | undefined {
  const times = dates.map((d) => new Date(d).getTime()).filter(Number.isFinite);
  return times.length ? new Date(Math.max(...times)) : undefined;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // If Supabase is unreachable these degrade to empty arrays, so the sitemap
  // loses its content entries but is still served.
  const [{ data: posts }, { data: projects }] = await Promise.all([getBlogPosts(), getProjects()]);

  const postsUpdated = latest(posts.map((p) => p.updated_at));
  const projectsUpdated = latest(projects.map((p) => p.updated_at));
  const siteUpdated = latest(
    [postsUpdated, projectsUpdated]
      .filter((d): d is Date => Boolean(d))
      .map((d) => d.toISOString()),
  );

  return [
    { url: absoluteUrl("/"), lastModified: siteUpdated, changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/about"), changeFrequency: "monthly", priority: 0.8 },
    {
      url: absoluteUrl("/projects"),
      lastModified: projectsUpdated,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/blog"),
      lastModified: postsUpdated,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    { url: absoluteUrl("/experience"), changeFrequency: "monthly", priority: 0.7 },
    { url: absoluteUrl("/contact"), changeFrequency: "yearly", priority: 0.5 },

    ...posts.map((post) => ({
      url: absoluteUrl(`/blog/${post.slug}`),
      lastModified: new Date(post.updated_at),
      changeFrequency: "monthly" as const,
      priority: 0.7,
      images: [absoluteUrl(`/blog/${post.slug}/opengraph-image`)],
    })),

    ...projects.map((project) => ({
      url: absoluteUrl(`/projects/${project.id}`),
      lastModified: new Date(project.updated_at),
      changeFrequency: "monthly" as const,
      priority: 0.8,
      images: [absoluteUrl(`/projects/${project.id}/opengraph-image`)],
    })),
  ];
}

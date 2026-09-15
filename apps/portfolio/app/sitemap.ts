import type { MetadataRoute } from "next";
import { getBlogPosts, getProjects } from "@repo/data/content";
import { getSiteUrl } from "@repo/config/env";

/**
 * Dynamic sitemap.
 *
 * The previous version listed five hardcoded URLs and no content pages, so no
 * blog post or project was ever discoverable through it. This enumerates the
 * real published rows — and only published ones, since the queries filter on
 * `published = true`, which keeps drafts out of search engines.
 */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();

  const lastModified = new Date();

  // `satisfies` keeps the literal `changeFrequency` types through the .map(),
  // which a plain annotation would widen to `string`.
  const staticRoutes: MetadataRoute.Sitemap = (
    [
      { url: baseUrl, changeFrequency: "monthly", priority: 1 },
      { url: `${baseUrl}/about`, changeFrequency: "monthly", priority: 0.8 },
      { url: `${baseUrl}/projects`, changeFrequency: "monthly", priority: 0.8 },
      { url: `${baseUrl}/experience`, changeFrequency: "monthly", priority: 0.8 },
      { url: `${baseUrl}/blog`, changeFrequency: "weekly", priority: 0.8 },
      { url: `${baseUrl}/contact`, changeFrequency: "yearly", priority: 0.5 },
    ] satisfies MetadataRoute.Sitemap
  ).map((route) => ({ ...route, lastModified }));

  // If Supabase is unreachable the content queries degrade to empty arrays, so
  // the sitemap loses its content entries but is still served.
  const [posts, projects] = await Promise.all([getBlogPosts(), getProjects()]);

  const postRoutes: MetadataRoute.Sitemap = posts.data.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.created_at),
    changeFrequency: "yearly",
    priority: 0.6,
  }));

  const projectRoutes: MetadataRoute.Sitemap = projects.data.map((project) => ({
    url: `${baseUrl}/projects/${project.id}`,
    lastModified: new Date(project.created_at),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...postRoutes, ...projectRoutes];
}

import type { MetadataRoute } from "next"
import { supabaseServer } from "@/lib/supabase-server"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://morganbarber.me"

  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/experience`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/projects`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    },
  ]

  // Fetch published blog posts
  const { data: blogPosts } = await supabaseServer
    .from("blog_posts")
    .select("slug, updated_at, published_at")
    .eq("published", true)
    .order("published_at", { ascending: false })

  const blogPages = (blogPosts || []).map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.updated_at),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }))

  // Fetch projects
  const { data: projects } = await supabaseServer
    .from("projects")
    .select("id, updated_at")
    .order("updated_at", { ascending: false })

  // Since projects don't have individual pages, we'll just update the projects page priority
  // based on when projects were last updated
  if (projects && projects.length > 0) {
    const projectsPageIndex = staticPages.findIndex((page) => page.url.endsWith("/projects"))
    if (projectsPageIndex !== -1) {
      staticPages[projectsPageIndex].lastModified = new Date(projects[0].updated_at)
    }
  }

  return [...staticPages, ...blogPages]
}

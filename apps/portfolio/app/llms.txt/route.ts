import { getBlogPosts, getProjects } from "@repo/data/content";
import { SITE_CONFIG } from "@repo/config/site";
import { absoluteUrl, readableTitle } from "@/lib/seo";

/**
 * /llms.txt — a plain-Markdown summary of the site for AI tools.
 *
 * An emerging convention (llmstxt.org) read by some AI assistants and answer
 * engines when they are asked about a site or a person. It is cheap to serve,
 * contains nothing that is not already public on the pages it links to, and
 * gives those tools an accurate, owner-written description instead of one
 * inferred from scraped fragments.
 */

export const revalidate = 3600;

export async function GET(): Promise<Response> {
  const [{ data: posts }, { data: projects }] = await Promise.all([getBlogPosts(), getProjects()]);

  const lines = [
    `# ${SITE_CONFIG.name}`,
    "",
    `> ${SITE_CONFIG.seoDescription}`,
    "",
    SITE_CONFIG.description,
    "",
    "## Pages",
    "",
    `- [About](${absoluteUrl("/about")}): background, offensive skills and certifications`,
    `- [Experience](${absoluteUrl("/experience")}): work history and education`,
    `- [Projects](${absoluteUrl("/projects")}): security tools and experiments`,
    `- [Blog](${absoluteUrl("/blog")}): offensive security write-ups`,
    `- [Contact](${absoluteUrl("/contact")}): email and contact form`,
  ];

  if (projects.length) {
    lines.push("", "## Projects", "");
    for (const p of projects) {
      lines.push(
        `- [${readableTitle(p.title)}](${absoluteUrl(`/projects/${p.id}`)}): ${p.description}`,
      );
    }
  }

  if (posts.length) {
    lines.push("", "## Blog posts", "");
    for (const p of posts) {
      lines.push(
        `- [${readableTitle(p.title)}](${absoluteUrl(`/blog/${p.slug}`)})${p.summary ? `: ${p.summary}` : ""}`,
      );
    }
  }

  lines.push("", "## Contact", "", `- Email: ${SITE_CONFIG.email}`, "");

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

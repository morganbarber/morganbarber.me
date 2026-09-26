import { getBlogPosts } from "@repo/data/content";
import { SITE_CONFIG } from "@repo/config/site";
import { absoluteUrl, readableTitle } from "@/lib/seo";

/**
 * RSS 2.0 feed of published posts, at /blog/feed.xml.
 *
 * Feeds are how security readers actually follow blogs (feed readers,
 * aggregators, newsletters that syndicate), and each subscriber-side fetch is
 * a discovery path that does not depend on search ranking. The layout
 * advertises it with <link rel="alternate" type="application/rss+xml">.
 */

export const revalidate = 3600;

/** XML-escapes text. Titles and summaries come from the database. */
function xml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET(): Promise<Response> {
  const { data: posts } = await getBlogPosts();

  const items = posts
    .map((post) => {
      const url = absoluteUrl(`/blog/${post.slug}`);
      return `    <item>
      <title>${xml(readableTitle(post.title))}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(post.created_at).toUTCString()}</pubDate>${
        post.summary ? `\n      <description>${xml(post.summary)}</description>` : ""
      }${post.tag ? `\n      <category>${xml(post.tag)}</category>` : ""}
      <author>${xml(`${SITE_CONFIG.email} (${SITE_CONFIG.name})`)}</author>
    </item>`;
    })
    .join("\n");

  const lastBuild = posts[0]
    ? new Date(posts[0].updated_at).toUTCString()
    : new Date(0).toUTCString();

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${xml(`${SITE_CONFIG.name} — Offensive Security Blog`)}</title>
    <link>${absoluteUrl("/blog")}</link>
    <description>${xml("Offensive security write-ups: HackTheBox machines, web exploitation, privilege escalation and tooling.")}</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
    <atom:link href="${absoluteUrl("/blog/feed.xml")}" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>
`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

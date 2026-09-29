import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Clock } from "lucide-react";
import { getBlogPost, getBlogPosts, getBlogSlugs } from "@repo/data/content";
import { SITE_CONFIG } from "@repo/config/site";
import Prose from "@/components/prose";
import Breadcrumbs from "@/components/breadcrumbs";
import StructuredData from "@/components/structured-data";
import { pageMetadata, readableTitle } from "@/lib/seo";
import { blogPostingNode, breadcrumbNode, graph } from "@/lib/structured-data";

type Props = {
  params: Promise<{ id: string }>;
};

/**
 * Slugs are used directly in a database filter and in metadata, so they are
 * validated against the same shape the `blog_posts_slug_format` CHECK enforces.
 * Anything else is a 404 without a round trip.
 */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Posts linked at the foot of each article. */
const MORE_POSTS = 3;

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});

export async function generateStaticParams() {
  const { data: slugs } = await getBlogSlugs();
  return slugs.map((id) => ({ id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  if (!SLUG_PATTERN.test(id)) return { title: "Post Not Found", robots: { index: false } };

  const { data: post } = await getBlogPost(id);
  if (!post) return { title: "Post Not Found", robots: { index: false } };

  return pageMetadata({
    // Stored titles are uppercase for display; the <title> reads as a sentence.
    title: readableTitle(post.title),
    description: post.summary ?? `${readableTitle(post.title)} — by ${SITE_CONFIG.name}.`,
    path: `/blog/${post.slug}`,
    type: "article",
    ownImage: true,
    publishedTime: post.created_at,
    modifiedTime: post.updated_at,
    tags: post.tag ? [post.tag] : undefined,
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { id } = await params;
  if (!SLUG_PATTERN.test(id)) notFound();

  // The list read is cached like the post, so the related-posts block costs no
  // extra database work on a warm cache.
  const [{ data: post }, { data: allPosts }] = await Promise.all([getBlogPost(id), getBlogPosts()]);
  if (!post) notFound();

  const morePosts = allPosts.filter((other) => other.slug !== post.slug).slice(0, MORE_POSTS);
  const title = readableTitle(post.title);
  const updatedLater =
    new Date(post.updated_at).getTime() - new Date(post.created_at).getTime() > 86_400_000;

  return (
    <main className="min-h-screen pt-32 pb-24 px-6 max-w-3xl mx-auto">
      <StructuredData
        data={graph(
          blogPostingNode(post),
          breadcrumbNode([
            { name: "Home", path: "/" },
            { name: "Blog", path: "/blog" },
            { name: title, path: `/blog/${post.slug}` },
          ]),
        )}
      />

      <Breadcrumbs
        items={[{ name: "Home", href: "/" }, { name: "Blog", href: "/blog" }, { name: title }]}
      />

      <article>
        <header className="mb-10 border-b border-muted pb-8">
          <div className="flex flex-wrap items-center gap-4 text-sm font-mono text-primary mb-4">
            {/* Machine-readable date alongside the stylised display date. */}
            <time dateTime={post.created_at}>
              {post.date ?? dateFormatter.format(new Date(post.created_at))}
            </time>
            {post.tag ? (
              <span className="border border-muted px-2 py-1 rounded-full">{post.tag}</span>
            ) : null}
            {post.reading_minutes ? (
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <Clock className="size-3" aria-hidden="true" />
                {post.reading_minutes} MIN READ
              </span>
            ) : null}
          </div>

          <h1 className="text-4xl md:text-5xl font-bold uppercase leading-tight mb-6">
            {post.title}
          </h1>

          {post.summary ? (
            <p className="text-xl text-muted-foreground leading-relaxed">{post.summary}</p>
          ) : null}

          {/*
            Visible byline linking to the author page. Authorship that a reader
            can see and follow is the concrete form of the "experience and
            expertise" signal search quality guidelines describe.
          */}
          <p className="mt-6 kicker">
            By{" "}
            <Link
              href="/about"
              rel="author"
              className="text-foreground hover:text-primary transition-colors"
            >
              {SITE_CONFIG.name}
            </Link>
            {updatedLater ? (
              <>
                {" · Updated "}
                <time dateTime={post.updated_at}>
                  {dateFormatter.format(new Date(post.updated_at))}
                </time>
              </>
            ) : null}
          </p>
        </header>

        {/*
          Rendered as plain text split on blank lines, never as HTML — see
          components/prose.tsx.
        */}
        <Prose content={post.content} />
      </article>

      {morePosts.length > 0 ? (
        <aside aria-labelledby="more-posts" className="mt-20 border-t border-muted pt-10">
          <h2 id="more-posts" className="eyebrow uppercase mb-6">
            {"// More from the blog"}
          </h2>
          <ul className="list-none m-0 p-0 border-t border-muted">
            {morePosts.map((other) => (
              <li key={other.slug}>
                <Link
                  href={`/blog/${other.slug}`}
                  className="group flex items-start justify-between gap-6 border-b border-muted py-5 transition-colors"
                >
                  <span>
                    <span className="block font-bold uppercase group-hover:text-primary transition-colors">
                      {other.title}
                    </span>
                    {other.summary ? (
                      <span className="block mt-2 text-sm text-muted-foreground">
                        {other.summary}
                      </span>
                    ) : null}
                  </span>
                  <ArrowRight
                    className="size-4 mt-1 shrink-0 text-muted-foreground group-hover:text-primary transition-colors"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      ) : null}
    </main>
  );
}

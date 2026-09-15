import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock } from "lucide-react";
import { getBlogPost, getBlogSlugs } from "@repo/data/content";
import { getSiteUrl } from "@repo/config/env";
import Prose from "@/components/prose";

type Props = {
  params: Promise<{ id: string }>;
};

/**
 * Slugs are used directly in a database filter and in metadata, so they are
 * validated against the same shape the `blog_posts_slug_format` CHECK enforces.
 * Anything else is a 404 without a round trip.
 */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function generateStaticParams() {
  const { data: slugs } = await getBlogSlugs();
  return slugs.map((id) => ({ id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  if (!SLUG_PATTERN.test(id)) return { title: "Post Not Found" };

  const { data: post } = await getBlogPost(id);
  if (!post) return { title: "Post Not Found", robots: { index: false } };

  const url = `${getSiteUrl()}/blog/${post.slug}`;

  return {
    title: post.title,
    description: post.summary ?? undefined,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.summary ?? undefined,
      type: "article",
      url,
      publishedTime: post.created_at,
      modifiedTime: post.updated_at,
      authors: ["Morgan Barber"],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.summary ?? undefined,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { id } = await params;
  if (!SLUG_PATTERN.test(id)) notFound();

  const { data: post } = await getBlogPost(id);
  if (!post) notFound();

  return (
    <main className="min-h-screen pt-32 pb-24 px-6 max-w-3xl mx-auto">
      <Link
        href="/blog"
        className="inline-flex items-center text-muted-foreground hover:text-primary mb-8 transition-colors focus-visible:outline-2 focus-visible:outline-primary"
      >
        <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" /> BACK TO BLOG
      </Link>

      <article>
        <header className="mb-10 border-b border-muted pb-8">
          <div className="flex flex-wrap items-center gap-4 text-sm font-mono text-primary mb-4">
            {post.date ? <time dateTime={post.created_at}>{post.date}</time> : null}
            {post.tag ? (
              <span className="border border-muted px-2 py-1 rounded-full">{post.tag}</span>
            ) : null}
            {post.reading_minutes ? (
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <Clock className="h-3 w-3" aria-hidden="true" />
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
        </header>

        {/*
          Rendered as plain text split on blank lines, never as HTML. The
          previous version padded every post with hardcoded Lorem Ipsum and a
          Bruce Schneier quote regardless of content; this shows what is
          actually stored, and nothing else.
        */}
        <Prose content={post.content} />
      </article>
    </main>
  );
}

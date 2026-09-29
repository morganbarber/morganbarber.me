import GlitchHeading from "@repo/ui/glitch-heading";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { BlogPostSummary } from "@repo/types";

export default function BlogPage({ posts }: { posts: BlogPostSummary[] }) {
  return (
    <main className="min-h-screen pt-32 px-6 max-w-7xl mx-auto">
      <GlitchHeading
        as="h1"
        lines={["LATEST", "BLOG"]}
        className="text-5xl md:text-8xl leading-none"
        lineClassName={[undefined, "text-transparent text-stroke"]}
        wrapperClassName={"mb-8"}
      />

      {/* Descriptive intro: gives search engines (and first-time readers) a
                statement of what this index covers, rather than a bare list. */}
      <p className="max-w-2xl font-mono text-muted-foreground leading-relaxed mb-16">
        Offensive security write-ups: retired HackTheBox machines, web exploitation, privilege
        escalation and the Python tools I build along the way.
      </p>

      {/* A log, not a stack of cards: date in the margin, ruled rows, the whole
          row is the link. */}
      <ol className="border-t border-muted">
        {posts.map((post, index) => (
          <li
            key={post.id}
            className="enter-rise border-b border-muted"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <Link
              href={`/blog/${post.slug}`}
              className="group grid gap-4 py-10 md:grid-cols-[11rem_1fr_auto] md:gap-10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
            >
              <div className="flex flex-row gap-4 md:flex-col md:gap-2 font-mono text-xs uppercase tracking-widest">
                <span className="text-primary">{post.date}</span>
                {post.tag ? <span className="text-muted-foreground">#{post.tag}</span> : null}
              </div>
              <article className="max-w-3xl">
                <h2 className="text-3xl md:text-4xl font-bold uppercase leading-tight transition-colors group-hover:text-primary">
                  {post.title}
                </h2>
                {post.summary ? (
                  <p className="mt-4 text-muted-foreground leading-relaxed">{post.summary}</p>
                ) : null}
              </article>
              <span className="hidden md:flex items-center gap-2 self-center font-mono text-xs uppercase tracking-widest text-muted-foreground transition-colors group-hover:text-primary">
                Read log
                <ArrowRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </main>
  );
}

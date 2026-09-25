import GlitchHeading from "@repo/ui/glitch-heading";
import Link from "next/link";
import MagneticButton from "@repo/ui/magnetic-button";

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
        Cybersecurity research and write-ups: threat analysis, network defence, zero-trust
        architecture and security automation with Python.
      </p>

      <div className="grid gap-12">
        {posts.map((post, index) => (
          <article
            key={post.id}
            className="enter-rise group border border-muted p-6 md:p-8 hover:bg-muted/5 transition-colors"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex flex-col md:flex-row justify-between items-start gap-6">
              <div className="space-y-4 max-w-3xl">
                <div className="flex items-center gap-4 text-xs font-mono uppercase tracking-widest">
                  <span className="text-primary">{post.date}</span>
                  <span className="border border-muted px-2 py-1 rounded-full">{post.tag}</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold uppercase group-hover:text-primary transition-colors">
                  {post.title}
                </h2>
                <p className="text-muted-foreground leading-relaxed">{post.summary}</p>
              </div>
              <div className="mt-4 md:mt-0">
                <Link href={`/blog/${post.slug}`}>
                  <MagneticButton className="whitespace-nowrap">READ LOG</MagneticButton>
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}

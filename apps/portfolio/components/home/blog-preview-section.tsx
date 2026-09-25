"use client";

import Link from "next/link";
import type { BlogPostSummary } from "@repo/types";

export default function BlogPreviewSection({ posts }: { posts: BlogPostSummary[] }) {
  return (
    <section className="bg-foreground text-background py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between md:items-end mb-16 gap-6">
          <div>
            <h2 className="text-4xl md:text-8xl font-bold uppercase leading-none">
              LATEST
              <br />
              BLOG
            </h2>
          </div>
          <p className="max-w-md font-mono text-sm leading-relaxed opacity-80">
            Analysis of emerging threats and operational techniques. Knowledge is the only
            sustainable advantage.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {posts.slice(0, 2).map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group block border-t border-background/20 pt-8"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="font-mono text-xs border border-background/20 px-2 rounded-full">
                  {post.tag}
                </span>
                <span className="font-mono text-xs">{post.date}</span>
              </div>
              <h3 className="text-2xl md:text-3xl font-bold uppercase mb-4 leading-tight group-hover:underline decoration-2 underline-offset-4">
                {post.title}
              </h3>
              <p className="opacity-70 text-sm">{post.summary}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

import Link from "next/link";
import type { BlogPostSummary } from "@repo/types";

/**
 * Blog posts as a log: date in the margin, ruled rows, a rule that sweeps
 * across on hover. Server component; shared by the home page and /blog.
 */
export default function PostList({ posts }: { posts: BlogPostSummary[] }) {
  return (
    <ol className="border-t border-line">
      {posts.map((post) => (
        <li
          key={post.id}
          data-reveal
          data-post
          data-flip-id={post.id}
          className="border-b border-line"
        >
          <Link
            href={`/blog/${post.slug}`}
            data-cursor="read"
            className="group relative grid gap-4 py-10 md:grid-cols-[11rem_minmax(0,1fr)_auto] md:gap-10"
          >
            <span
              aria-hidden="true"
              className="absolute -bottom-px left-0 h-px w-full origin-left scale-x-0 bg-primary transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100"
            />
            <span className="flex gap-4 font-mono text-xs md:flex-col md:gap-2">
              <span className="text-primary">{post.date}</span>
              {post.tag ? (
                <span className="text-muted-foreground">#{post.tag.toLowerCase()}</span>
              ) : null}
            </span>
            <span className="max-w-3xl">
              <span className="font-head block text-[clamp(1.6rem,3vw,2.6rem)] capitalize transition-colors duration-300 group-hover:text-primary">
                {post.title.toLowerCase()}
              </span>
              {post.summary ? (
                <span className="mt-4 block leading-relaxed text-muted-foreground">
                  {post.summary}
                </span>
              ) : null}
            </span>
            <span className="hidden self-center font-mono text-xs text-muted-foreground md:block">
              {post.reading_minutes ? `${post.reading_minutes} min` : ""}
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}

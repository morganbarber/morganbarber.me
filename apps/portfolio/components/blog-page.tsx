import type { BlogPostSummary } from "@repo/types";
import PageIntro from "@/components/page-intro";
import PostList from "@/components/post-list";

export default function BlogPage({ posts }: { posts: BlogPostSummary[] }) {
  return (
    <main>
      {/* Descriptive intro: tells search engines (and first-time readers) what
          this index covers, rather than presenting a bare list. */}
      <PageIntro
        path="/blog"
        title="Blog"
        lede="Offensive security write-ups: retired HackTheBox machines, web exploitation, privilege escalation and the Python tools I build along the way."
      >
        <a
          href="/blog/feed.xml"
          className="link-draw mt-8 inline-block font-mono text-sm text-primary"
        >
          rss feed
        </a>
      </PageIntro>
      <section className="shell pb-32">
        <PostList posts={posts} />
      </section>
    </main>
  );
}

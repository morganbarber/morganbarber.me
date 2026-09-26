import type { Metadata } from "next";
import BlogPage from "@/components/blog-page";
import StructuredData from "@/components/structured-data";
import { getBlogPosts } from "@repo/data/content";
import { pageMetadata } from "@/lib/seo";
import { blogIndexNode, breadcrumbNode, graph } from "@/lib/structured-data";

export const metadata: Metadata = pageMetadata({
  title: "Offensive Security Blog",
  description:
    "Offensive security write-ups by Morgan Barber: retired HackTheBox machines, web exploitation, privilege escalation and hacking tools built in Python.",
  path: "/blog",
});

export default async function Blog() {
  const { data: posts } = await getBlogPosts();

  return (
    <>
      <StructuredData
        data={graph(
          blogIndexNode(posts),
          breadcrumbNode([
            { name: "Home", path: "/" },
            { name: "Blog", path: "/blog" },
          ]),
        )}
      />
      <BlogPage posts={posts} />
    </>
  );
}

import type { Metadata } from "next";
import BlogPage from "@/components/blog-page";
import StructuredData from "@/components/structured-data";
import { getBlogPosts } from "@repo/data/content";
import { pageMetadata } from "@/lib/seo";
import { blogIndexNode, breadcrumbNode, graph } from "@/lib/structured-data";

export const metadata: Metadata = pageMetadata({
  title: "Cybersecurity Blog",
  description:
    "Cybersecurity research and write-ups by Morgan Barber: threat analysis, network defence, zero-trust architecture and security automation with Python.",
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

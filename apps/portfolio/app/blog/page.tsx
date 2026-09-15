import type { Metadata } from "next";
import BlogPage from "@/components/blog-page";
import { getBlogPosts } from "@repo/data/content";
import { getSiteUrl } from "@repo/config/env";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Cybersecurity research, analysis of emerging threats, and operational techniques by Morgan Barber.",
  alternates: { canonical: `${getSiteUrl()}/blog` },
  openGraph: {
    title: "Blog | Morgan Barber",
    description: "Read the latest cybersecurity research and analysis.",
    url: `${getSiteUrl()}/blog`,
  },
};

export default async function Blog() {
  const { data: posts } = await getBlogPosts();
  return <BlogPage posts={posts} />;
}

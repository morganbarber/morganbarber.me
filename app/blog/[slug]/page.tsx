import type { Metadata } from "next"
import { supabaseServer } from "@/lib/supabase-server"
import BlogPostClient from "./BlogPostClient"

// This would be generated server-side in a real app
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params

  const { data: post } = await supabaseServer
    .from("blog_posts")
    .select("title, excerpt, published_at, tags")
    .eq("slug", slug)
    .eq("published", true)
    .single()

  if (!post) {
    return {
      title: "Post Not Found",
    }
  }

  return {
    title: post.title,
    description: post.excerpt || `Read ${post.title} by Morgan Barber, cybersecurity specialist.`,
    keywords: post.tags?.join(", "),
    openGraph: {
      title: post.title,
      description: post.excerpt || `Read ${post.title} by Morgan Barber, cybersecurity specialist.`,
      url: `https://morganbarber.dev/blog/${slug}`,
      type: "article",
      publishedTime: post.published_at,
      authors: ["Morgan Barber"],
      tags: post.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt || `Read ${post.title} by Morgan Barber, cybersecurity specialist.`,
    },
  }
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <BlogPostClient slug={slug} />
}

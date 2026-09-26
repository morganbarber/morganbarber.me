import { getBlogPost } from "@repo/data/content";
import { SITE_CONFIG } from "@repo/config/site";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = `Blog post by ${SITE_CONFIG.name}`;

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = SLUG_PATTERN.test(id) ? (await getBlogPost(id)).data : null;

  // A missing post still gets a valid, on-brand image rather than an error —
  // a crawler that caches a broken preview keeps showing it.
  return renderOgImage({
    eyebrow: post?.tag ? `Blog · ${post.tag}` : "Blog",
    title: post?.title ?? "Offensive security blog",
    subtitle: post?.summary ?? null,
    chips: post?.reading_minutes ? [`${post.reading_minutes} min read`] : [],
  });
}

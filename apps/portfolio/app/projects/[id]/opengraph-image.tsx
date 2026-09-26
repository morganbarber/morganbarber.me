import { getProject } from "@repo/data/content";
import { SITE_CONFIG } from "@repo/config/site";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = `Project by ${SITE_CONFIG.name}`;

const ID_PATTERN = /^[a-zA-Z0-9]+(?:[-_][a-zA-Z0-9]+)*$/;

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = ID_PATTERN.test(id) ? (await getProject(id)).data : null;

  return renderOgImage({
    eyebrow: project ? `Project · ${project.category}` : "Project",
    title: project?.title ?? "Security projects",
    subtitle: project?.description ?? null,
    chips: project?.tags.slice(0, 4) ?? [],
  });
}

import { SITE_CONFIG } from "@repo/config/site";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og";

/**
 * Default social image. Applies to every route without its own
 * opengraph-image — about, experience, contact and the two indexes.
 */
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = `${SITE_CONFIG.name} — ${SITE_CONFIG.role}`;

export default async function Image() {
  return renderOgImage({
    eyebrow: "Cybersecurity portfolio",
    title: SITE_CONFIG.name,
    subtitle: "Network security · Threat analysis · System hardening",
    chips: ["Security+", "Python", "Linux"],
  });
}

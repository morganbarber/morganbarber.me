import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { SITE_CONFIG } from "@repo/config/site";

/**
 * Social preview images (Open Graph / Twitter), generated per page.
 *
 * Replaces the single `/og-image.png` that every page previously pointed at —
 * which was actually a 1024×1024 JPEG declared as a 1200×630 PNG, and a
 * textless background at that. Shared on LinkedIn, Discord or X it produced a
 * dark grid with no name and no title, and the mismatched dimensions meant
 * platforms cropped it unpredictably.
 *
 * Each image here states what the link is: the post or project title, its
 * category, and the site owner. That text is what earns the click when a link
 * is shared, which is where most of a portfolio's inbound traffic comes from.
 */

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const COLORS = {
  background: "#050505",
  foreground: "#ededed",
  muted: "#8a8a8a",
  primary: "#00ff41",
  grid: "#141414",
};

export interface OgImageInput {
  /** Small label above the title, e.g. "BLOG" or "PROJECT". */
  eyebrow: string;
  title: string;
  /** One line under the title. */
  subtitle?: string | null;
  /** Short chips, e.g. tags. */
  chips?: string[];
}

/** Scales the headline down as it gets longer, so it always fits in 3 lines. */
function titleSize(title: string): number {
  if (title.length <= 24) return 92;
  if (title.length <= 40) return 76;
  if (title.length <= 60) return 62;
  return 52;
}

/**
 * Oswald Bold — the site's heading face — read once per server instance. The
 * renderer's built-in font has a single regular weight, so without this the
 * headline ignored its bold weight and did not match the site.
 */
let headingFont: Promise<Buffer> | null = null;
function loadHeadingFont(): Promise<Buffer> {
  headingFont ??= readFile(join(process.cwd(), "assets/fonts/Oswald-Bold.woff"));
  return headingFont;
}

export async function renderOgImage({
  eyebrow,
  title,
  subtitle,
  chips = [],
}: OgImageInput): Promise<ImageResponse> {
  // Fall back to the built-in font rather than failing the image if the file
  // is ever missing from a deployment.
  const oswald = await loadHeadingFont().catch(() => null);
  const heading = oswald ? "Oswald" : "sans-serif";
  const safeTitle = title.length > 110 ? `${title.slice(0, 107)}…` : title;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "64px 72px",
        background: COLORS.background,
        // The site's grid motif, drawn with gradients so no image asset is
        // needed at render time.
        backgroundImage: `linear-gradient(${COLORS.grid} 2px, transparent 2px), linear-gradient(90deg, ${COLORS.grid} 2px, transparent 2px)`,
        backgroundSize: "64px 64px",
        color: COLORS.foreground,
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <div style={{ width: 56, height: 4, background: COLORS.primary }} />
        <div
          style={{
            display: "flex",
            fontSize: 26,
            letterSpacing: 6,
            color: COLORS.primary,
            textTransform: "uppercase",
          }}
        >
          {`// ${eyebrow}`}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div
          style={{
            display: "flex",
            fontFamily: heading,
            fontSize: titleSize(safeTitle) * 1.15,
            fontWeight: 700,
            lineHeight: 1.02,
            letterSpacing: -1,
            textTransform: "uppercase",
            maxWidth: 1050,
          }}
        >
          {safeTitle}
        </div>
        {subtitle ? (
          <div
            style={{
              display: "flex",
              fontSize: 30,
              color: COLORS.muted,
              maxWidth: 1000,
              lineHeight: 1.3,
            }}
          >
            {subtitle.length > 120 ? `${subtitle.slice(0, 117)}…` : subtitle}
          </div>
        ) : null}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 12 }}>
          {chips.slice(0, 4).map((chip) => (
            <div
              key={chip}
              style={{
                display: "flex",
                fontSize: 20,
                letterSpacing: 2,
                padding: "8px 16px",
                border: `2px solid ${COLORS.primary}`,
                color: COLORS.primary,
                textTransform: "uppercase",
              }}
            >
              {chip}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          <div
            style={{
              display: "flex",
              fontFamily: heading,
              fontSize: 34,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            {SITE_CONFIG.name}
          </div>
          <div style={{ display: "flex", fontSize: 22, color: COLORS.muted }}>morganbarber.me</div>
        </div>
      </div>
    </div>,
    {
      ...OG_SIZE,
      fonts: oswald ? [{ name: "Oswald", data: oswald, weight: 700, style: "normal" }] : [],
    },
  );
}

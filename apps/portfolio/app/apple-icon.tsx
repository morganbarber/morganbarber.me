import { ImageResponse } from "next/og";

/**
 * 180×180 PNG for iOS home-screen bookmarks, and the raster fallback for
 * browsers that do not render SVG favicons (Safari among them). Same prompt
 * monogram as app/icon.svg.
 */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#050505",
      }}
    >
      <svg width="180" height="180" viewBox="0 0 48 48">
        <polyline
          points="12,15 22,24 12,33"
          fill="none"
          stroke="#00ff41"
          strokeWidth="4"
          strokeLinecap="square"
        />
        <line
          x1="25"
          y1="33"
          x2="37"
          y2="33"
          stroke="#00ff41"
          strokeWidth="4"
          strokeLinecap="square"
        />
      </svg>
    </div>,
    size,
  );
}

import { cn } from "../utils";

/**
 * Chromatic-aberration glitch heading.
 *
 * REWRITTEN to fix a layout bug: the last character of every heading wrapped
 * onto its own line.
 *
 * The cause was the old structure. It wrapped the heading in
 * `<div class="relative inline-block">` and rendered the text THREE times — one
 * real element plus two absolutely positioned copies for the colour-fringe
 * layers. `inline-block` makes the wrapper shrink-to-fit, and browsers compute
 * that width from the text's fractional advance width and then round it *down*.
 * A heading whose text measures 412.4px got a 412px box — a fraction of a pixel
 * too narrow — so the final glyph no longer fit and wrapped. Larger type and
 * tighter letter-spacing made the shortfall more likely, which is why it showed
 * up on the display headings specifically.
 *
 * The fix is structural rather than a nudge to the width: render the text once,
 * in one block-level element, and draw the glitch layers with `::before` and
 * `::after` pulling from `data-text`. No shrink-to-fit box, so nothing to round.
 *
 * Three other bugs disappeared with it:
 *
 *   • Selecting a heading used to copy its text three times, because
 *     `aria-hidden` hides an element from assistive tech but not from the
 *     selection. Pseudo-element content is not selectable at all.
 *   • Pages rendered several `<h1>` elements with identical text (the default
 *     `as` is "h1" and some sections use two of these side by side). Now one
 *     element is emitted per call, so the heading outline reflects what was
 *     actually intended.
 *   • The layers used `-z-10`, which put them *behind* the section background
 *     in any parent that created a stacking context — on those sections the
 *     effect never appeared at all.
 *
 * This is now a server component: the effect is pure CSS, so there is no reason
 * to ship it to the browser. The `"use client"` directive is gone.
 */

interface GlitchTextProps {
  text: string;
  className?: string;
  /** Element to render. Pick the one that fits the page's heading outline. */
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span" | "div";
}

export default function GlitchText({
  text,
  className,
  as: Component = "h1",
}: GlitchTextProps) {
  return (
    <Component
      // Read by the ::before/::after layers via content: attr(data-text).
      data-text={text}
      className={cn("glitch-text font-bold uppercase tracking-tighter", className)}
    >
      {text}
    </Component>
  );
}

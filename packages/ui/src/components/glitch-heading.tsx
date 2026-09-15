import { cn } from "../utils";

/**
 * Multi-line display heading with the glitch effect.
 *
 * The site's signature title treatment stacks two lines, the second usually in
 * outline (`text-stroke`). That was previously built from two separate
 * `GlitchText` components, each of which defaulted to rendering an `<h1>` — so
 * the home page emitted ten `<h1>` elements and every stacked title split its
 * accessible name in half ("SECURITY", then separately "SERVICES").
 *
 * This renders ONE heading element containing one `<span>` per line. The
 * accessible name is the full title, the document has a real heading outline,
 * and each line still gets its own chromatic-aberration layers from the
 * `.glitch-text` CSS.
 */

interface GlitchHeadingProps {
  /** One entry per visual line. Joined with a space for the accessible name. */
  lines: readonly [string, ...string[]];
  /** Heading level. Choose so the page outline stays in order. */
  as?: "h1" | "h2" | "h3" | "h4";
  /** Classes applied to every line — typically the type scale. */
  className?: string;
  /**
   * Per-line classes, positionally matched to `lines`. Used for the outline
   * treatment on the second line.
   */
  lineClassName?: readonly (string | undefined)[];
  /** Classes for the heading element itself (margins, alignment). */
  wrapperClassName?: string;
}

export default function GlitchHeading({
  lines,
  as: Component = "h2",
  className,
  lineClassName,
  wrapperClassName,
}: GlitchHeadingProps) {
  return (
    <Component className={wrapperClassName}>
      {lines.map((line, index) => (
        <span
          key={line}
          // Read by the ::before/::after layers in globals.css.
          data-text={line}
          className={cn(
            "glitch-text block font-bold uppercase tracking-tighter",
            className,
            lineClassName?.[index],
          )}
        >
          {line}
        </span>
      ))}
    </Component>
  );
}

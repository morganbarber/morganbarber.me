import GlitchHeading from "@repo/ui/glitch-heading";
import { cn } from "@repo/ui/utils";

/**
 * The header every home section opens with: a green rule and eyebrow label,
 * then a two-line glitch heading whose second line is outlined.
 *
 * `align="end"` puts the rule after the label and right-aligns the header on
 * mobile — the variation the toolkit section uses.
 */
export default function SectionHeader({
  eyebrow,
  title,
  intro,
  compact = false,
  align = "start",
  className,
}: {
  eyebrow: string;
  /** Two lines; the second renders outlined. */
  title: [string, string];
  intro?: React.ReactNode;
  /** Smaller intro in a narrower column, for headers in a side column. */
  compact?: boolean;
  align?: "start" | "end";
  className?: string;
}) {
  const end = align === "end";
  const rule = <div className="h-px w-12 bg-primary" />;

  return (
    <div className={cn(end && "text-right md:text-left", className)}>
      <div className={cn("mb-4 flex items-center gap-4", end && "justify-end md:justify-start")}>
        {!end && rule}
        <span className="eyebrow">{eyebrow}</span>
        {end && rule}
      </div>

      <GlitchHeading
        as="h2"
        lines={title}
        className="text-4xl md:text-6xl"
        lineClassName={[undefined, "text-stroke"]}
      />

      {intro ? (
        <p
          // Size before leading: cn() (tailwind-merge) lets a later text-sm
          // override an earlier leading-* because font-size sets line-height.
          className={cn(
            "mt-6 font-mono text-muted-foreground",
            compact ? "max-w-sm text-sm" : "max-w-xl",
            "leading-relaxed",
          )}
        >
          {intro}
        </p>
      ) : null}
    </div>
  );
}

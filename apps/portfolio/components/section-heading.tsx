import { cn } from "@repo/ui/utils";

/**
 * The header every section opens with: a mono index and label, a rule that
 * draws itself, then the heading rising line by line (data-split, wired by
 * ScrollEffects). Server component.
 */
export default function SectionHeading({
  index,
  label,
  title,
  intro,
  as: Heading = "h2",
  className,
  children,
}: {
  index: string;
  label: string;
  title: string;
  intro?: React.ReactNode;
  as?: "h1" | "h2";
  className?: string;
  /** Rendered at the right of the heading row (a link, a count). */
  children?: React.ReactNode;
}) {
  return (
    <header className={cn("mb-14 md:mb-20", className)}>
      <div className="mb-8 flex items-center gap-4 label">
        <span className="text-primary">{index}</span>
        <span data-draw className="h-px flex-1 bg-line" />
        <span>{label}</span>
      </div>
      <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <Heading data-split className="font-head max-w-4xl text-[clamp(2.75rem,7vw,6.5rem)]">
          {title}
        </Heading>
        {children}
      </div>
      {intro ? (
        <p data-reveal className="mt-8 max-w-xl text-lg leading-relaxed text-muted-foreground">
          {intro}
        </p>
      ) : null}
    </header>
  );
}

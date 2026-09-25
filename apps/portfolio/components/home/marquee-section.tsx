import { MARQUEE_TEXT } from "@repo/config/site";

/**
 * Infinite ticker.
 *
 * Previously animated with framer-motion from x=0 to a hard-coded x=-1000px and
 * looped. That only loops seamlessly if the content happens to be exactly
 * 1000px wide, which it never is (and varies with viewport and font size), so
 * every cycle ended with a visible jump back to the start.
 *
 * Now pure CSS: the track holds two identical halves and translates by -50%,
 * i.e. by exactly one half's width whatever that width is. At the end of each
 * cycle the second half sits precisely where the first began, so the reset is
 * invisible. It also runs on the compositor rather than the main thread and
 * ships no JavaScript — this is a server component now.
 */

const SEGMENTS = 4;

function Half({ hidden }: { hidden?: boolean }) {
  return (
    // The duplicate half is decorative; screen readers get the text once.
    <div className="flex shrink-0 gap-8 pr-8" aria-hidden={hidden || undefined}>
      {Array.from({ length: SEGMENTS }, (_, i) => (
        <span
          key={i}
          className="font-sans text-2xl md:text-4xl font-bold uppercase tracking-wide whitespace-nowrap"
        >
          {MARQUEE_TEXT}
        </span>
      ))}
    </div>
  );
}

export default function MarqueeSection() {
  return (
    <div className="w-full bg-primary text-background overflow-hidden py-4 border-y border-background">
      <div className="marquee-track flex w-max">
        <Half />
        <Half hidden />
      </div>
    </div>
  );
}

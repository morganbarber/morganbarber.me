import { ArrowUpRight } from "lucide-react";
import GlitchHeading from "@repo/ui/glitch-heading";
import { HACKTHEBOX } from "@repo/config/site";
import type { HackTheBoxStats } from "@repo/data/hackthebox";

/**
 * HackTheBox profile highlight.
 *
 * A server component with no animation library. Every other home section fades
 * in with framer-motion, whose server-rendered state is `opacity:0` until
 * hydration — this section is visible in the very first paint instead, which
 * is one less thing that can flicker.
 *
 * Stat tiles render only for values that exist, so a partially filled fallback
 * (or a field HTB dropped from its API) never shows an empty "—" grid.
 */

interface Stat {
  label: string;
  value: string;
  /** Visually dominant tile. */
  primary?: boolean;
}

const formatter = new Intl.NumberFormat("en-US");

function buildStats(stats: HackTheBoxStats): Stat[] {
  const out: Stat[] = [];

  if (stats.rank) out.push({ label: "Rank", value: stats.rank, primary: true });
  if (stats.ranking !== null) {
    out.push({ label: "Global ranking", value: `#${formatter.format(stats.ranking)}` });
  }
  if (stats.points !== null) out.push({ label: "Points", value: formatter.format(stats.points) });
  if (stats.systemOwns !== null) {
    out.push({ label: "System owns", value: formatter.format(stats.systemOwns) });
  }
  if (stats.userOwns !== null) {
    out.push({ label: "User owns", value: formatter.format(stats.userOwns) });
  }

  const bloods = (stats.userBloods ?? 0) + (stats.systemBloods ?? 0);
  if (stats.userBloods !== null || stats.systemBloods !== null) {
    out.push({ label: "First bloods", value: formatter.format(bloods) });
  }

  if (stats.respects !== null) {
    out.push({ label: "Respect", value: formatter.format(stats.respects) });
  }

  return out;
}

export default function HackTheBoxSection({ stats }: { stats: HackTheBoxStats }) {
  const tiles = buildStats(stats);

  return (
    <section className="bg-background py-24 lg:py-32 border-t border-muted">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-10 mb-16">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="h-px bg-primary w-12" />
              <span className="font-mono text-sm tracking-widest text-primary">
                OFFENSIVE PRACTICE
              </span>
            </div>
            <GlitchHeading
              as="h2"
              lines={["HACK THE", "BOX"]}
              className="text-4xl md:text-6xl"
              lineClassName={[undefined, "text-transparent text-stroke"]}
            />
            <p className="mt-6 max-w-xl font-mono text-muted-foreground leading-relaxed">
              {HACKTHEBOX.tagline}
            </p>
          </div>

          <a
            href={stats.profileUrl}
            target="_blank"
            rel="noopener noreferrer external"
            className="group inline-flex items-center gap-3 self-start lg:self-auto border border-primary px-6 py-4 font-mono text-sm uppercase tracking-widest text-primary hover:bg-primary hover:text-background transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
          >
            {stats.username ? `@${stats.username}` : "View profile"}
            <ArrowUpRight
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              aria-hidden="true"
            />
            <span className="sr-only">(HackTheBox profile, opens in a new tab)</span>
          </a>
        </div>

        {tiles.length > 0 ? (
          <dl className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-px bg-muted border border-muted">
            {tiles.map((tile) => (
              <div
                key={tile.label}
                className={`bg-background p-6 md:p-8 flex flex-col-reverse gap-3 ${
                  tile.primary ? "col-span-2 md:col-span-1" : ""
                }`}
              >
                <dt className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  {tile.label}
                </dt>
                <dd
                  className={`font-sans font-bold uppercase tabular-nums leading-none ${
                    tile.primary ? "text-4xl md:text-5xl text-primary" : "text-3xl md:text-4xl"
                  }`}
                >
                  {tile.value}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}

        {stats.rankProgress !== null && stats.nextRank ? (
          <div className="mt-8 max-w-xl">
            <div className="flex justify-between font-mono text-xs uppercase tracking-widest text-muted-foreground mb-2">
              <span>Progress to {stats.nextRank}</span>
              <span className="tabular-nums">{stats.rankProgress}%</span>
            </div>
            <div
              className="h-2 bg-muted overflow-hidden"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={stats.rankProgress}
              aria-label={`Progress to ${stats.nextRank}`}
            >
              <div className="h-full bg-primary" style={{ width: `${stats.rankProgress}%` }} />
            </div>
          </div>
        ) : null}

        {stats.source === "live" ? (
          <p className="mt-6 font-mono text-xs text-muted-foreground">
            {"// live from HackTheBox · refreshed every 6 hours"}
          </p>
        ) : null}
      </div>
    </section>
  );
}

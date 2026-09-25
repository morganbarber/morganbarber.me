import { ArrowUpRight } from "lucide-react";
import GlitchHeading from "@repo/ui/glitch-heading";
import { HACKTHEBOX } from "@repo/config/site";
import type { HackTheBoxStats } from "@repo/data/hackthebox";

/**
 * HackTheBox profile highlight.
 *
 * Built around what the profile actually has: a rank and the climb to the next
 * one, machines owned, challenges and Sherlocks solved, and the categories
 * those solves are in. Vanity stats that are zero for most players (first
 * bloods, respect, leaderboard position) are not shown — the data layer turns
 * every zero into null, and each block below renders only when its value
 * exists, so a stat appears on its own once it becomes real.
 *
 * A server component with no animation library. Every other home section fades
 * in with framer-motion, whose server-rendered state is `opacity:0` until
 * hydration — this section is visible in the very first paint instead, which
 * is one less thing that can flicker.
 */

const number = new Intl.NumberFormat("en-US");
const monthYear = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/** "2025-09-15" → "Sep 2025". */
function formatSince(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : monthYear.format(date);
}

/** Terminal-style segmented bar: filled cells read at a glance, and it can't be mistaken for a loading spinner. */
function SegmentBar({ value, label }: { value: number; label: string }) {
  const segments = 20;
  const filled = Math.round((value / 100) * segments);
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      aria-label={label}
      className="flex gap-1"
    >
      {Array.from({ length: segments }, (_, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={`h-3 flex-1 ${i < filled ? "bg-primary" : "bg-muted"}`}
        />
      ))}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
      {children}
    </span>
  );
}

export default function HackTheBoxSection({ stats }: { stats: HackTheBoxStats }) {
  const since = formatSince(stats.memberSince);
  const hasMachines = stats.systemOwns !== null || stats.userOwns !== null;

  const solves = [
    stats.challengesSolved !== null && {
      label: "Challenges solved",
      value: stats.challengesSolved,
      detail: null,
    },
    stats.sherlocksSolved !== null && {
      label: stats.sherlocksSolved === 1 ? "Sherlock solved" : "Sherlocks solved",
      value: stats.sherlocksSolved,
      detail:
        stats.sherlockTasks !== null
          ? `${number.format(stats.sherlockTasks)} tasks answered`
          : null,
    },
  ].filter((item) => item !== false);

  const hasRank = stats.rank !== null;
  const hasActivity = hasMachines || solves.length > 0 || stats.focusAreas.length > 0;

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

        {hasRank || hasActivity ? (
          <div className="grid lg:grid-cols-12 gap-px bg-muted border border-muted">
            {hasRank ? (
              <div className="lg:col-span-5 bg-background flex flex-col">
                <div className="flex items-center gap-2 border-b border-muted px-6 py-3 font-mono text-xs text-muted-foreground">
                  <span className="h-2 w-2 bg-primary" aria-hidden="true" />
                  <span className="truncate">
                    ~/htb/{stats.username ?? "profile"} <span className="text-primary">$</span> rank
                  </span>
                </div>

                <div className="p-6 md:p-8 flex flex-col gap-8 flex-1">
                  <div className="flex flex-col gap-3">
                    <Label>Current rank</Label>
                    <p className="font-sans font-bold uppercase leading-none text-4xl md:text-5xl text-primary">
                      {stats.rank}
                    </p>
                  </div>

                  {stats.rankProgress !== null && stats.nextRank ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex justify-between gap-4">
                        <Label>Next: {stats.nextRank}</Label>
                        <span className="font-mono text-xs tabular-nums text-primary">
                          {stats.rankProgress}%
                        </span>
                      </div>
                      <SegmentBar
                        value={stats.rankProgress}
                        label={`Progress from ${stats.rank} to ${stats.nextRank}`}
                      />
                    </div>
                  ) : null}

                  {stats.points !== null || since ? (
                    <dl className="mt-auto grid grid-cols-2 gap-6 border-t border-muted pt-6">
                      {stats.points !== null ? (
                        <div className="flex flex-col-reverse gap-2">
                          <dt>
                            <Label>Points</Label>
                          </dt>
                          <dd className="font-sans font-bold text-2xl tabular-nums">
                            {number.format(stats.points)}
                          </dd>
                        </div>
                      ) : null}
                      {since ? (
                        <div className="flex flex-col-reverse gap-2">
                          <dt>
                            <Label>Hacking since</Label>
                          </dt>
                          <dd className="font-sans font-bold text-2xl uppercase">{since}</dd>
                        </div>
                      ) : null}
                    </dl>
                  ) : null}
                </div>
              </div>
            ) : null}

            {hasActivity ? (
              <div
                className={`${hasRank ? "lg:col-span-7" : "lg:col-span-12"} bg-background p-6 md:p-8 flex flex-col gap-10`}
              >
                {hasMachines ? (
                  <div className="flex flex-col gap-4">
                    <Label>Machines owned</Label>
                    <dl className="grid grid-cols-2 gap-6">
                      {stats.systemOwns !== null ? (
                        <div className="flex flex-col-reverse gap-2">
                          <dt className="font-mono text-sm text-muted-foreground">
                            root <span className="text-xs">/ system flags</span>
                          </dt>
                          <dd className="font-sans font-bold text-5xl md:text-6xl leading-none tabular-nums">
                            {number.format(stats.systemOwns)}
                          </dd>
                        </div>
                      ) : null}
                      {stats.userOwns !== null ? (
                        <div className="flex flex-col-reverse gap-2">
                          <dt className="font-mono text-sm text-muted-foreground">
                            user <span className="text-xs">/ foothold flags</span>
                          </dt>
                          <dd className="font-sans font-bold text-5xl md:text-6xl leading-none tabular-nums">
                            {number.format(stats.userOwns)}
                          </dd>
                        </div>
                      ) : null}
                    </dl>
                  </div>
                ) : null}

                {solves.length > 0 ? (
                  <dl className="grid grid-cols-2 gap-6 border-t border-muted pt-8">
                    {solves.map((item) => (
                      <div
                        key={item.label}
                        // column-reverse packs to the bottom; justify-end pins numbers to the top so
                        // a two-line label ("24 tasks answered") does not push its number out of line.
                        className="flex flex-col-reverse justify-end gap-2"
                      >
                        <dt className="flex flex-col gap-1">
                          <Label>{item.label}</Label>
                          {item.detail ? (
                            <span className="font-mono text-xs text-muted-foreground/70">
                              {item.detail}
                            </span>
                          ) : null}
                        </dt>
                        <dd className="font-sans font-bold text-3xl md:text-4xl leading-none tabular-nums">
                          {number.format(item.value)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                ) : null}

                {stats.focusAreas.length > 0 ? (
                  <div className="flex flex-col gap-4 border-t border-muted pt-8">
                    <Label>Where I&apos;ve been solving</Label>
                    <ul className="flex flex-col gap-4">
                      {stats.focusAreas.map((area) => (
                        <li key={`${area.kind}-${area.name}`} className="flex flex-col gap-2">
                          <div className="flex items-baseline justify-between gap-4 font-mono text-sm">
                            <span>
                              {area.name}{" "}
                              <span className="text-xs text-muted-foreground">
                                · {area.kind.toLowerCase()}
                              </span>
                            </span>
                            <span className="text-xs tabular-nums text-muted-foreground">
                              {area.owned}/{area.total}
                            </span>
                          </div>
                          <div
                            className="h-1 bg-muted"
                            role="progressbar"
                            aria-valuemin={0}
                            aria-valuemax={area.total}
                            aria-valuenow={area.owned}
                            aria-label={`${area.name} ${area.kind.toLowerCase()}: ${area.owned} of ${area.total}`}
                          >
                            {/* A floor of 2% keeps a single solve in a large category visible. */}
                            <div
                              className="h-full bg-primary"
                              style={{ width: `${Math.max(area.percent, 2)}%` }}
                            />
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : null}
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

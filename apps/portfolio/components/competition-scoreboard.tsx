import { ArrowUpRight, Trophy } from "lucide-react";
import { cn } from "@repo/ui/utils";
import type { CompetitionSummary } from "@repo/types";

/**
 * Competitions as a CTF scoreboard: ruled rows, not cards. Shared by the home
 * section and the experience page so both stay identical.
 *
 * Optional fields (organizer, period, result, team, link) render only when
 * set — the admin seeds entries without results, and a row reading
 * "Result: —" says less than one that simply lists the event.
 */

const COLUMNS = "md:grid-cols-[3rem_minmax(0,1fr)_11rem_7rem_minmax(0,13rem)]";

export default function CompetitionScoreboard({
  competitions,
}: {
  competitions: CompetitionSummary[];
}) {
  return (
    <div role="table" aria-label="Competitions" className="font-mono">
      <div
        role="row"
        className={cn("kicker hidden gap-6 border-b border-primary/60 pb-3 md:grid", COLUMNS)}
      >
        <span role="columnheader">#</span>
        <span role="columnheader">Event</span>
        <span role="columnheader">Format</span>
        <span role="columnheader">When</span>
        <span role="columnheader">Result</span>
      </div>

      {competitions.map((c, i) => (
        <div
          key={c.id}
          role="row"
          className={cn(
            "group relative grid gap-x-6 gap-y-2 border-b border-muted py-6 transition-colors hover:bg-primary/[0.03]",
            COLUMNS,
          )}
        >
          {/* Accent that slides in on hover — the row, not a box, is the unit. */}
          <span
            aria-hidden="true"
            className="absolute inset-y-0 left-0 w-0.5 origin-top scale-y-0 bg-primary transition-transform duration-300 group-hover:scale-y-100"
          />

          <span role="cell" className="text-sm text-primary tabular-nums md:pl-3">
            {String(i + 1).padStart(2, "0")}
          </span>

          <div role="cell" className="min-w-0">
            <h3 className="font-sans text-2xl md:text-3xl font-bold uppercase leading-tight">
              {c.link ? (
                <a
                  href={c.link}
                  target="_blank"
                  rel="noopener noreferrer external"
                  className="inline-flex items-start gap-2 transition-colors hover:text-primary"
                >
                  {c.name}
                  <ArrowUpRight
                    className="mt-1 size-4 shrink-0 opacity-40 transition-opacity group-hover:opacity-100"
                    aria-hidden="true"
                  />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              ) : (
                c.name
              )}
            </h3>
            {c.organizer ? (
              <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                {c.organizer}
                {c.team ? (
                  <>
                    {" "}
                    · team <span className="text-foreground">{c.team}</span>
                  </>
                ) : null}
              </p>
            ) : null}
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
              {c.description}
            </p>
          </div>

          <span
            role="cell"
            className="text-xs uppercase tracking-wider text-muted-foreground md:pt-2"
          >
            {c.format}
          </span>

          <span role="cell" className="text-xs tabular-nums text-muted-foreground md:pt-2">
            {c.period ?? ""}
          </span>

          <span role="cell" className="text-sm text-primary md:pt-1">
            {c.result ? (
              <span className="inline-flex items-start gap-2">
                <Trophy className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                {c.result}
              </span>
            ) : null}
          </span>
        </div>
      ))}
    </div>
  );
}

import { ArrowUpRight, Trophy } from "lucide-react";
import type { CompetitionSummary } from "@repo/types";

/**
 * One CTF / competition entry. Shared by the home section and the experience
 * page so both stay identical.
 *
 * Every optional field (organizer, period, result, team, link) renders only
 * when set — the admin dashboard seeds entries without results, and an entry
 * showing "Result: —" would read worse than one that simply lists the event.
 */
export default function CompetitionCard({ competition }: { competition: CompetitionSummary }) {
  const { name, organizer, format, period, result, team, description, link } = competition;

  return (
    <article className="bg-background p-6 md:p-8 flex flex-col gap-4 h-full">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="font-mono text-xs uppercase tracking-widest text-primary border border-primary px-2 py-1">
          {format}
        </span>
        {period ? (
          <span className="font-mono text-xs tabular-nums text-muted-foreground">{period}</span>
        ) : null}
      </div>

      <div>
        <h3 className="text-2xl md:text-3xl font-bold uppercase leading-tight">{name}</h3>
        {organizer ? (
          <p className="mt-1 text-sm uppercase tracking-wide text-muted-foreground">{organizer}</p>
        ) : null}
      </div>

      {result ? (
        <p className="flex items-start gap-2 font-mono text-sm text-primary">
          <Trophy className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
          <span>{result}</span>
        </p>
      ) : null}

      <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>

      {team || link ? (
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-2 font-mono text-xs">
          {team ? (
            <span className="text-muted-foreground">
              TEAM <span className="text-foreground">{team}</span>
            </span>
          ) : (
            <span />
          )}
          {link ? (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer external"
              className="group inline-flex items-center gap-1 uppercase tracking-widest text-primary hover:text-foreground transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
            >
              Details
              <ArrowUpRight
                className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                aria-hidden="true"
              />
              <span className="sr-only"> about {name} (opens in a new tab)</span>
            </a>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

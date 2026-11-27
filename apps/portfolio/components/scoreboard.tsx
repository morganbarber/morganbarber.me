import type { CompetitionSummary } from "@repo/types";

/**
 * Competitions as a CTF scoreboard: ruled rows, each event name decoding
 * itself as it arrives (data-scramble). Optional fields render only when set.
 * Server component; shared by the home page and /experience.
 */
export default function Scoreboard({ competitions }: { competitions: CompetitionSummary[] }) {
  return (
    <div role="table" aria-label="Competitions">
      <div
        role="row"
        className="hidden gap-6 border-b border-line pb-4 label md:grid md:grid-cols-[3rem_minmax(0,1fr)_12rem_7rem_minmax(0,12rem)]"
      >
        <span role="columnheader">#</span>
        <span role="columnheader">event</span>
        <span role="columnheader">format</span>
        <span role="columnheader">when</span>
        <span role="columnheader">result</span>
      </div>

      {competitions.map((c, i) => (
        <div
          key={c.id}
          role="row"
          data-reveal
          className="group relative grid gap-x-6 gap-y-2 border-b border-line py-8 md:grid-cols-[3rem_minmax(0,1fr)_12rem_7rem_minmax(0,12rem)]"
        >
          <span
            aria-hidden="true"
            className="absolute inset-y-0 left-0 w-px origin-top scale-y-0 bg-primary transition-transform duration-500 group-hover:scale-y-100"
          />
          <span role="cell" className="font-mono text-sm text-primary tabular-nums md:pl-3">
            {String(i + 1).padStart(2, "0")}
          </span>
          <div role="cell" className="min-w-0">
            <h3 className="font-head text-[clamp(1.6rem,2.6vw,2.4rem)]">
              {c.link ? (
                <a
                  href={c.link}
                  target="_blank"
                  rel="noopener noreferrer external"
                  className="transition-colors hover:text-primary"
                >
                  <span data-scramble>{c.name}</span>
                  <span aria-hidden="true" className="ml-2 text-base text-muted-foreground">
                    ↗
                  </span>
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              ) : (
                <span data-scramble>{c.name}</span>
              )}
            </h3>
            {c.organizer ? (
              <p className="mt-1 text-sm text-muted-foreground">
                {c.organizer}
                {c.team ? (
                  <>
                    , team <span className="text-foreground">{c.team}</span>
                  </>
                ) : null}
              </p>
            ) : null}
            <p className="mt-3 max-w-xl leading-relaxed text-muted-foreground">{c.description}</p>
          </div>
          <span role="cell" className="font-mono text-xs text-muted-foreground md:pt-3">
            {c.format}
          </span>
          <span
            role="cell"
            className="font-mono text-xs tabular-nums text-muted-foreground md:pt-3"
          >
            {c.period ?? ""}
          </span>
          <span role="cell" className="text-sm text-primary md:pt-2">
            {c.result ?? ""}
          </span>
        </div>
      ))}
    </div>
  );
}

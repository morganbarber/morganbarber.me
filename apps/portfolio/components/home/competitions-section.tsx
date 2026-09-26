import GlitchHeading from "@repo/ui/glitch-heading";
import type { CompetitionSummary } from "@repo/types";
import CompetitionCard from "@/components/competition-card";

/**
 * CTFs and cyber competitions. Server component with no animation library,
 * like the HackTheBox section it follows: visible in the first paint.
 * Rendered only when there is at least one published competition.
 */
export default function CompetitionsSection({
  competitions,
}: {
  competitions: CompetitionSummary[];
}) {
  return (
    <section className="bg-muted/5 py-24 lg:py-32 border-y border-muted">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-16">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-px bg-primary w-12" />
            <span className="font-mono text-sm tracking-widest text-primary">COMPETITIONS</span>
          </div>
          <GlitchHeading
            as="h2"
            lines={["CAPTURE", "THE FLAG"]}
            className="text-4xl md:text-6xl"
            lineClassName={[undefined, "text-transparent text-stroke"]}
          />
          <p className="mt-6 max-w-xl font-mono text-muted-foreground leading-relaxed">
            Offense under a clock in CTFs, defense under a clock in CyberPatriot. Competitions are
            where the practice gets tested.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-muted border border-muted">
          {competitions.map((competition) => (
            <CompetitionCard key={competition.id} competition={competition} />
          ))}
        </div>
      </div>
    </section>
  );
}

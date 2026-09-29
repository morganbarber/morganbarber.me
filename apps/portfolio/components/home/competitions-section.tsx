import SectionHeader from "@/components/section-header";
import type { CompetitionSummary } from "@repo/types";
import CompetitionScoreboard from "@/components/competition-scoreboard";

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
      <div className="shell">
        <SectionHeader
          eyebrow="COMPETITIONS"
          title={["CAPTURE", "THE FLAG"]}
          intro="Offense under a clock in CTFs, defense under a clock in CyberPatriot. Competitions are where the practice gets tested."
          className="mb-16"
        />

        <CompetitionScoreboard competitions={competitions} />
      </div>
    </section>
  );
}

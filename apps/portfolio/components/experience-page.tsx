import type { CompetitionSummary, EducationSummary, ExperienceSummary } from "@repo/types";
import PageIntro from "@/components/page-intro";
import SectionHeading from "@/components/section-heading";
import Timeline from "@/components/timeline";
import Scoreboard from "@/components/scoreboard";
import { toTimeline } from "@/components/home-page";

export default function ExperiencePage({
  experience,
  education,
  competitions,
}: {
  experience: ExperienceSummary[];
  education: EducationSummary[];
  competitions: CompetitionSummary[];
}) {
  return (
    <main>
      <PageIntro
        path="/experience"
        title="Experience"
        lede="Work, school and competitions: where the skills came from and where they get tested."
      />

      <section className="shell pb-24">
        <Timeline entries={toTimeline(experience, education)} />
      </section>

      {competitions.length > 0 ? (
        <section className="shell section-pad" aria-labelledby="competitions-heading">
          <SectionHeading index="01" label="competitions" title="CTFs and cyber defense." />
          <Scoreboard competitions={competitions} />
        </section>
      ) : null}
    </main>
  );
}

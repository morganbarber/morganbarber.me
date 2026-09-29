import GlitchText from "@repo/ui/glitch-text";
import type { CompetitionSummary, EducationSummary, ExperienceSummary } from "@repo/types";
import CompetitionScoreboard from "@/components/competition-scoreboard";

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
    <main className="min-h-screen pt-32 shell">
      <GlitchText text="EXPERIENCE" className="text-5xl md:text-8xl block leading-none" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* Work Experience */}
        <div>
          <h2 className="text-2xl font-bold mb-8 text-primary font-mono uppercase tracking-widest">
            {"// WORK HISTORY"}
          </h2>
          <div className="relative border-l border-muted ml-4 pl-8 space-y-12">
            {experience.map((job, index) => (
              <div
                key={job.id}
                className="enter-slide relative"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <div className="node absolute top-2 -left-[37px] size-4 border-2" />
                <div className="font-mono text-primary text-sm mb-2">{job.period}</div>
                <h3 className="text-2xl md:text-3xl font-bold uppercase mb-2 leading-tight">
                  {job.role}
                </h3>
                <div className="text-lg text-muted-foreground mb-4 uppercase">{job.company}</div>
                <p className="text-muted-foreground leading-relaxed text-sm">{job.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Education */}
        <div>
          <h2 className="text-2xl font-bold mb-8 text-primary font-mono uppercase tracking-widest">
            {"// ACADEMIC RECORDS"}
          </h2>
          <ol className="border-t border-muted">
            {education.map((edu, index) => (
              <li
                key={edu.id}
                className="enter-rise border-b border-muted py-8"
                style={{ animationDelay: `${0.2 + index * 0.2}s` }}
              >
                <span className="block font-sans text-3xl font-bold uppercase leading-none tracking-tight text-stroke">
                  {edu.period}
                </span>
                <h3 className="mt-4 text-xl md:text-2xl font-bold uppercase leading-tight">
                  {edu.degree}
                </h3>
                <div className="mt-1 text-lg text-muted-foreground uppercase">{edu.school}</div>
                <p className="mt-4 text-muted-foreground leading-relaxed text-sm">{edu.details}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {competitions.length > 0 ? (
        <section className="mt-24 pb-32" aria-labelledby="competitions-heading">
          <h2
            id="competitions-heading"
            className="text-2xl font-bold mb-8 text-primary font-mono uppercase tracking-widest"
          >
            {"// COMPETITIONS & CTFS"}
          </h2>
          <div className="enter-rise">
            <CompetitionScoreboard competitions={competitions} />
          </div>
        </section>
      ) : null}
    </main>
  );
}

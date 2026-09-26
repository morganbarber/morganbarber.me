import GlitchText from "@repo/ui/glitch-text";
import type { CompetitionSummary, EducationSummary, ExperienceSummary } from "@repo/types";
import CompetitionCard from "@/components/competition-card";

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
    <main className="min-h-screen pt-32 px-6 max-w-7xl mx-auto">
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
                <div className="absolute -left-[37px] top-2 w-4 h-4 bg-background border-2 border-primary rounded-full group-hover:bg-primary transition-colors" />
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
          <div className="space-y-12">
            {education.map((edu, index) => (
              <div
                key={edu.id}
                className="enter-rise border border-muted p-6 hover:bg-muted/5 transition-colors"
                style={{ animationDelay: `${0.2 + index * 0.2}s` }}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl md:text-2xl font-bold uppercase leading-tight">
                    {edu.degree}
                  </h3>
                  <span className="font-mono text-xs text-primary border border-primary px-2 py-1">
                    {edu.period}
                  </span>
                </div>
                <div className="text-lg text-muted-foreground mb-4 uppercase">{edu.school}</div>
                <p className="text-muted-foreground leading-relaxed text-sm">{edu.details}</p>
              </div>
            ))}
          </div>
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
          <div className="enter-rise grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-muted border border-muted">
            {competitions.map((competition) => (
              <CompetitionCard key={competition.id} competition={competition} />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}

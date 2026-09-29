import Link from "next/link";
import GlitchText from "@repo/ui/glitch-text";
import MagneticButton from "@repo/ui/magnetic-button";
import type { ProjectSummary } from "@repo/types";

export default function ProjectsPage({ projects }: { projects: ProjectSummary[] }) {
  return (
    <main className="min-h-screen pt-32 shell">
      <GlitchText text="PROJECTS" className="text-5xl md:text-8xl mb-8 block" />

      <p className="max-w-2xl font-mono text-muted-foreground leading-relaxed mb-12">
        Security tools and experiments I have built: intrusion detection, encrypted messaging and
        web vulnerability scanning, with write-ups and source.
      </p>

      <div className="space-y-8">
        {projects.map((project, index) => (
          <div
            key={project.id}
            className="enter-slide group relative border-t border-muted py-8 hover:bg-muted/10 transition-colors"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <Link href={`/projects/${project.id}`} className="block w-full">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div className="mb-4 md:mb-0">
                  <span className="font-mono text-primary text-sm mb-2 block">
                    {"// "}
                    {project.id}
                  </span>
                  <h2 className="text-4xl md:text-6xl font-bold uppercase group-hover:translate-x-4 transition-transform duration-300">
                    {project.title}
                  </h2>
                  <p className="mt-2 text-muted-foreground max-w-xl text-sm hidden md:block">
                    {project.description}
                  </p>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-right hidden md:block">
                    <p className="text-muted-foreground uppercase text-sm tracking-widest">
                      {project.category}
                    </p>
                    <p className="text-xs font-mono mt-1">{project.status}</p>
                  </div>
                  <MagneticButton className="opacity-0 group-hover:opacity-100 transition-opacity">
                    ACCESS
                  </MagneticButton>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </main>
  );
}

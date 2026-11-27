import type { ProjectSummary } from "@repo/types";
import PageIntro from "@/components/page-intro";
import ProjectList from "@/components/project-list";

export default function ProjectsPage({ projects }: { projects: ProjectSummary[] }) {
  return (
    <main>
      <PageIntro
        path="/projects"
        title="Projects"
        lede="Security tools and experiments I have built: intrusion detection, encrypted messaging and web vulnerability scanning, with write-ups and source."
      />
      <section className="shell pb-32">
        <ProjectList projects={projects} filterable />
      </section>
    </main>
  );
}

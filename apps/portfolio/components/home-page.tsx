import HeroSection from "@/components/home/hero-section";
import MarqueeSection from "@/components/home/marquee-section";
import PhilosophySection from "@/components/home/philosophy-section";
import ServicesSection from "@/components/home/services-section";
import ExperienceSection from "@/components/home/experience-section";
import StackSection from "@/components/home/stack-section";
import EducationSection from "@/components/home/education-section";
import ProjectsPreviewSection from "@/components/home/projects-preview-section";
import BlogPreviewSection from "@/components/home/blog-preview-section";
import CtaSection from "@/components/home/cta-section";
import HackTheBoxSection from "@/components/home/hackthebox-section";
import CompetitionsSection from "@/components/home/competitions-section";
import type { HackTheBoxStats } from "@repo/data/hackthebox";

import type {
  BlogPostSummary,
  CompetitionSummary,
  EducationSummary,
  ExperienceSummary,
  ProjectSummary,
} from "@repo/types";

export default function HomePage({
  posts,
  experience,
  projects,
  education,
  hackTheBox,
  competitions,
}: {
  posts: BlogPostSummary[];
  experience: ExperienceSummary[];
  projects: ProjectSummary[];
  education: EducationSummary[];
  /** Null until a HackTheBox profile ID is configured; the section is then omitted. */
  hackTheBox: HackTheBoxStats | null;
  competitions: CompetitionSummary[];
}) {
  return (
    <main className="min-h-screen flex flex-col justify-center overflow-hidden pt-20">
      <HeroSection />
      <MarqueeSection />
      <PhilosophySection />
      <ServicesSection />
      <ExperienceSection experience={experience} />
      <StackSection />
      {hackTheBox ? <HackTheBoxSection stats={hackTheBox} /> : null}
      {competitions.length > 0 ? <CompetitionsSection competitions={competitions} /> : null}
      <EducationSection education={education} />
      <ProjectsPreviewSection projects={projects} />
      <BlogPreviewSection posts={posts} />
      <CtaSection />
    </main>
  );
}
